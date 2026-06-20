import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ─── Reply templates ───────────────────────────────────────────────────────────

function buildAuthenticReply(name: string, brand: string, expiry: string | null): string {
  const expiryLine = expiry ? `\nExpiry: ${expiry}` : "";
  return `VERIFYGH: AUTHENTIC ✓\n${name} by ${brand} is GENUINE & FDA Approved. Safe to use.${expiryLine}\nStay safe - VerifyGH`;
}

function buildWarningReply(name: string, brand: string, reason: string): string {
  return `VERIFYGH: WARNING ⚠\n${name} by ${brand}: ${reason}\nDo NOT use. Report: verifygh.com\n- VerifyGH`;
}

function buildNotFoundReply(code: string): string {
  return `VERIFYGH: NOT FOUND ✗\nCode "${code}" not in database. This product may be COUNTERFEIT.\nDo NOT use. Report fake goods at verifygh.com\n- VerifyGH`;
}

function buildHelpReply(): string {
  return `VERIFYGH Help:\nSend the product code (e.g. VGH-KINA-2025-AB12) as an SMS to this number.\nWe will reply with AUTHENTIC, WARNING, or NOT FOUND.\nFree service - verifygh.com`;
}

// ─── Parse product code from raw SMS text ─────────────────────────────────────

function extractCode(rawText: string): string {
  const text = rawText.trim().toUpperCase();
  // Try to match VGH-XXXX-XXXX-XXXX pattern first
  const vghMatch = text.match(/VGH[-\s][A-Z0-9]{2,}[-\s][A-Z0-9]{2,}[-\s][A-Z0-9]{2,}/);
  if (vghMatch) return vghMatch[0].replace(/\s+/g, "-");
  // Remove common prefixes: CHECK, VERIFY, CODE, etc.
  const stripped = text.replace(/^(CHECK|VERIFY|CODE|PRODUCT|PRODUKTI|:|\s)+/i, "").trim();
  return stripped.replace(/\s+/g, "-");
}

// ─── Send SMS via Africa's Talking ────────────────────────────────────────────

async function sendSmsAfricasTalking(to: string, message: string, apiKey: string, username: string, senderId: string): Promise<boolean> {
  const baseUrl = username === "sandbox"
    ? "https://api.sandbox.africastalking.com/version1/messaging"
    : "https://api.africastalking.com/version1/messaging";

  const params = new URLSearchParams({ username, to, message });
  if (senderId) params.set("from", senderId);

  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "apiKey": apiKey,
    },
    body: params.toString(),
  });

  return res.ok;
}

// ─── Send SMS via Arkesel (Ghanaian provider) ─────────────────────────────────

async function sendSmsArkesel(to: string, message: string, apiKey: string, senderId: string): Promise<boolean> {
  const params = new URLSearchParams({
    action: "send-sms",
    api_key: apiKey,
    to,
    from: senderId || "VerifyGH",
    sms: message,
  });

  const res = await fetch(`https://sms.arkesel.com/sms/api?${params.toString()}`, {
    method: "GET",
    headers: { "Accept": "application/json" },
  });

  return res.ok;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  // ── Parse incoming SMS payload ──────────────────────────────────────────────
  const contentType = req.headers.get("content-type") || "";
  let from = "";
  let text = "";
  let provider = "unknown";

  try {
    if (contentType.includes("application/x-www-form-urlencoded")) {
      // Africa's Talking format
      const body = await req.text();
      const params = new URLSearchParams(body);
      from = params.get("from") || "";
      text = params.get("text") || "";
      provider = "africas_talking";
    } else {
      // JSON format (Arkesel, Mnotify, or custom)
      const body = await req.json();
      from = body.from || body.sender || body.phone || body.msisdn || "";
      text = body.text || body.message || body.body || body.sms || "";
      provider = body.provider || "json_generic";
    }
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to parse request body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!from) {
    return new Response(
      JSON.stringify({ error: "Missing sender phone number" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Empty text = help request
  if (!text || text.trim().length < 3) {
    text = "HELP";
  }

  // ── Config from env ─────────────────────────────────────────────────────────
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const atApiKey = Deno.env.get("AT_API_KEY") || "";
  const atUsername = Deno.env.get("AT_USERNAME") || "sandbox";
  const arkeselApiKey = Deno.env.get("ARKESEL_API_KEY") || "";
  const smsSenderId = Deno.env.get("SMS_SENDER_ID") || "VerifyGH";
  const smsSendNumber = Deno.env.get("SMS_SEND_NUMBER") || "";
  const smsProvider = Deno.env.get("SMS_PROVIDER") || (atApiKey ? "africas_talking" : arkeselApiKey ? "arkesel" : "none");

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // ── Handle HELP request ─────────────────────────────────────────────────────
  if (text.trim().toUpperCase() === "HELP" || text.trim().toUpperCase() === "INFO") {
    const replyMessage = buildHelpReply();
    await sendReply(smsProvider, smsSendNumber || from, replyMessage, atApiKey, atUsername, smsSenderId, arkeselApiKey, from);
    await supabase.from("sms_verifications").insert({
      phone_number: from, message_received: text.trim(), product_code: null,
      result: "not_found", product_name: null, reply_sent: replyMessage, provider,
    });
    return new Response(JSON.stringify({ success: true, type: "help" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Extract and look up product code ────────────────────────────────────────
  const productCode = extractCode(text);

  const { data: products } = await supabase
    .from("products")
    .select("id, name, brand, category, fda_approved, expiry_date, verification_code, barcode")
    .or(`verification_code.eq.${productCode},barcode.eq.${productCode},verification_code.ilike.${productCode}`)
    .limit(1);

  const product = products?.[0] ?? null;
  const now = new Date();
  let result: "authentic" | "warning" | "not_found";
  let replyMessage: string;

  if (product) {
    const isExpired = product.expiry_date && new Date(product.expiry_date) < now;
    if (isExpired) {
      result = "warning";
      replyMessage = buildWarningReply(product.name, product.brand, "This product is EXPIRED");
    } else if (!product.fda_approved) {
      result = "warning";
      replyMessage = buildWarningReply(product.name, product.brand, "NOT FDA APPROVED");
    } else {
      result = "authentic";
      const expiryFmt = product.expiry_date
        ? new Date(product.expiry_date).toLocaleDateString("en-GH", { month: "short", year: "numeric" })
        : null;
      replyMessage = buildAuthenticReply(product.name, product.brand, expiryFmt);
    }
  } else {
    result = "not_found";
    replyMessage = buildNotFoundReply(productCode);
  }

  // ── Send SMS reply ───────────────────────────────────────────────────────────
  await sendReply(smsProvider, from, replyMessage, atApiKey, atUsername, smsSenderId, arkeselApiKey, from);

  // ── Log to database ──────────────────────────────────────────────────────────
  await supabase.from("sms_verifications").insert({
    phone_number: from,
    message_received: text.trim(),
    product_code: productCode,
    result,
    product_name: product?.name ?? null,
    reply_sent: replyMessage,
    provider,
  });

  return new Response(
    JSON.stringify({ success: true, result, code: productCode, reply: replyMessage }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

// ─── Dispatch reply to correct SMS provider ───────────────────────────────────

async function sendReply(
  smsProvider: string,
  to: string,
  message: string,
  atApiKey: string,
  atUsername: string,
  smsSenderId: string,
  arkeselApiKey: string,
  _originalFrom: string,
): Promise<void> {
  try {
    if (smsProvider === "africas_talking" && atApiKey) {
      await sendSmsAfricasTalking(to, message, atApiKey, atUsername, smsSenderId);
    } else if (smsProvider === "arkesel" && arkeselApiKey) {
      await sendSmsArkesel(to, message, arkeselApiKey, smsSenderId);
    } else {
      console.warn(`No SMS provider configured. Would have sent to ${to}: ${message}`);
    }
  } catch (err) {
    console.error("Failed to send SMS reply:", err);
  }
}
