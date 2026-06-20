import { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, AlertTriangle, XCircle, ArrowLeft,
  Calendar, Hash, Globe, Building2, BadgeCheck,
  AlertOctagon, Share2, Flag, ScanLine, Info,
  CheckCircle2, Clock, FileText,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product, ResultState } from '../App';

// ─── Config for each verification state ──────────────────────────────────────

const STATE_CONFIG = {
  verified: {
    label: 'AUTHENTIC',
    sublabel: 'This product is genuine and verified',
    emoji: '✅',
    ribbonBg: 'bg-primary',
    ribbonText: 'text-white',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    Icon: ShieldCheck,
    detailAccent: 'border-primary-100 bg-primary-50',
    fdaBadgeBg: 'bg-primary-50',
    fdaBadgeText: 'text-primary',
    reportColor: 'text-gray-500',
  },
  warning: {
    label: 'SUSPECTED COUNTERFEIT',
    sublabel: 'Not FDA approved — exercise caution',
    emoji: '⚠️',
    ribbonBg: 'bg-amber-500',
    ribbonText: 'text-white',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    Icon: AlertTriangle,
    detailAccent: 'border-amber-100 bg-amber-50',
    fdaBadgeBg: 'bg-amber-50',
    fdaBadgeText: 'text-amber-700',
    reportColor: 'text-amber-600',
  },
  not_registered: {
    label: 'NOT FOUND',
    sublabel: 'Product not in our registry — do not buy',
    emoji: '❌',
    ribbonBg: 'bg-danger-500',
    ribbonText: 'text-white',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    Icon: XCircle,
    detailAccent: 'border-danger-100 bg-danger-50',
    fdaBadgeBg: 'bg-danger-50',
    fdaBadgeText: 'text-danger-500',
    reportColor: 'text-danger-500',
  },
} as const;

function fmt(d: string | null) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-GH', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function isExpired(d: string | null) {
  return !!d && new Date(d) < new Date();
}

function verificationRef() {
  return 'VGH-' + Date.now().toString(36).toUpperCase().slice(-6);
}

function nowStamp() {
  return new Date().toLocaleString('en-GH', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ResultScreen({
  product,
  code,
  state,
  onBack,
  onReport,
  onScanAgain,
}: {
  product: Product | null;
  code: string;
  state: ResultState;
  onBack: () => void;
  onReport: (name?: string) => void;
  onScanAgain: () => void;
}) {
  const [scanCount, setScanCount] = useState<number | null>(null);
  const ref = useRef(verificationRef());
  const stamp = useRef(nowStamp());
  const cfg = STATE_CONFIG[state];
  const expired = isExpired(product?.expiry_date ?? null);

  useEffect(() => {
    const name = product?.name || product?.product_name;
    if (!name) return;
    supabase
      .from('scans')
      .select('id', { count: 'exact', head: true })
      .eq('product_name', name)
      .then(({ count }) => { if (count !== null) setScanCount(count); });
  }, [product]);

  function shareWhatsApp() {
    const pName = product?.name || code;
    const msgs: Record<ResultState, string> = {
      verified: `✅ VerifyGH: "${pName}" is AUTHENTIC & FDA approved! Ref: ${ref.current}. Verify products at ghverify.com 🇬🇭`,
      warning: `⚠️ VerifyGH ALERT: "${pName}" is SUSPECTED COUNTERFEIT — not FDA approved. Ref: ${ref.current}. ghverify.com 🇬🇭`,
      not_registered: `❌ VerifyGH ALERT: Code "${code}" NOT FOUND in registry — potentially fake. Ref: ${ref.current}. ghverify.com 🇬🇭`,
    };
    window.open(`https://wa.me/?text=${encodeURIComponent(msgs[state])}`, '_blank');
  }

  const showReport = state === 'warning' || state === 'not_registered';
  const reportName = product?.name || code;

  return (
    <div className="min-h-screen bg-gray-100 pb-10">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white px-5 pt-12 pb-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Verification Result</p>
            <p className="text-sm font-bold text-gray-800">VerifyGH Certificate</p>
          </div>
        </div>
        <button
          onClick={shareWhatsApp}
          className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center"
          title="Share on WhatsApp"
        >
          <Share2 className="w-4.5 h-4.5 text-gray-600" />
        </button>
      </div>

      <div className="px-4 pt-4 space-y-3">

        {/* ── Status Hero Card ────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden shadow-md animate-slide-up">
          {/* Coloured ribbon */}
          <div className={`${cfg.ribbonBg} px-5 pt-6 pb-7 relative overflow-hidden`}>
            {/* Subtle geometry */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full" />
            <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-white/5 rounded-full" />

            <div className="relative z-10 flex items-start gap-4">
              {/* Icon */}
              <div className={`w-16 h-16 ${cfg.iconBg} rounded-2xl flex items-center justify-center flex-shrink-0 animate-check-bounce`}>
                <cfg.Icon className={`w-9 h-9 ${cfg.iconColor}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-2xl font-black text-white tracking-tight leading-none">
                    {cfg.label}
                  </span>
                </div>
                <p className="text-white/70 text-sm leading-snug">{cfg.sublabel}</p>

                {/* Scan count pill */}
                {scanCount !== null && (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                    <ScanLine className="w-3 h-3 text-white/80" />
                    <span className="text-[11px] text-white/80 font-medium">
                      {scanCount} verification{scanCount !== 1 ? 's' : ''} on record
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Certificate footer strip */}
          <div className="bg-white border-t border-gray-100 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[11px] text-gray-400 font-mono font-medium">{ref.current}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[11px] text-gray-400">{stamp.current}</span>
            </div>
          </div>
        </div>

        {/* ── Product Details Card ─────────────────────────────────────────── */}
        {product ? (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-fade-in">
            {/* Product header */}
            <div className="px-5 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 leading-tight">{product.name}</h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-500">{product.brand}</span>
                    {product.category && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="text-sm text-gray-400">{product.category}</span>
                      </>
                    )}
                  </div>
                </div>
                <FDABadge approved={product.fda_approved} cfg={cfg} />
              </div>
            </div>

            {/* Detail grid */}
            <div className="px-5 pt-4 pb-2">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-3">
                Product Details
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <Field
                  icon={Hash}
                  label="Batch Number"
                  value={product.batch_number || 'N/A'}
                />
                <Field
                  icon={Globe}
                  label="Country of Origin"
                  value={product.country_of_origin || 'N/A'}
                />
                <Field
                  icon={Calendar}
                  label="Manufactured"
                  value={fmt(product.manufacture_date)}
                />
                <Field
                  icon={Calendar}
                  label="Expiry Date"
                  value={fmt(product.expiry_date)}
                  warning={expired ? 'EXPIRED' : undefined}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="mx-5 my-3 border-t border-dashed border-gray-100" />

            {/* FDA status block */}
            <div className="px-5 pb-4">
              {product.fda_approved ? (
                <div className={`rounded-xl p-3.5 ${cfg.detailAccent} flex items-center gap-3`}>
                  <BadgeCheck className={`w-6 h-6 ${cfg.fdaBadgeText} flex-shrink-0`} />
                  <div>
                    <p className={`text-sm font-bold ${cfg.fdaBadgeText}`}>FDA Approved</p>
                    {product.registered_by && (
                      <p className={`text-xs mt-0.5 ${cfg.fdaBadgeText} opacity-60`}>
                        Registered by {product.registered_by}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl p-3.5 bg-amber-50 border border-amber-100 flex items-center gap-3">
                  <AlertOctagon className="w-6 h-6 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-700">FDA Approval Pending</p>
                    <p className="text-xs text-amber-600/70 mt-0.5">
                      Not yet approved by Ghana FDA
                    </p>
                  </div>
                </div>
              )}

              {expired && (
                <div className="mt-2.5 rounded-xl p-3.5 bg-danger-50 border border-danger-100 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-danger-500 flex-shrink-0" />
                  <p className="text-xs text-danger-600 font-medium leading-snug">
                    This product has passed its expiry date. Do not consume.
                  </p>
                </div>
              )}

              {product.verification_code && (
                <div className="mt-2.5 rounded-xl p-3 bg-gray-50 border border-gray-100 flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                      Verification Code
                    </p>
                    <p className="text-sm font-mono font-semibold text-gray-700 mt-0.5">
                      {product.verification_code}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* History footer */}
            {scanCount !== null && (
              <div className="border-t border-gray-100 px-5 py-3 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-400">Verification history</span>
                </div>
                <span className="text-xs font-bold text-gray-600">
                  {scanCount} scan{scanCount !== 1 ? 's' : ''} recorded
                </span>
              </div>
            )}
          </div>
        ) : (
          /* NOT FOUND — no product record */
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-fade-in">
            <div className="px-5 py-5">
              <h2 className="text-lg font-bold text-gray-800 mb-1">Unregistered Product</h2>
              <p className="text-sm text-gray-400 font-mono mb-4">
                Code: <span className="text-gray-600">{code}</span>
              </p>

              <div className="space-y-2.5">
                <InfoRow label="Registry Status" value="NOT REGISTERED" valueClass="text-danger-500 font-bold" />
                <div className="border-t border-gray-100" />
                <InfoRow label="Risk Level" value="HIGH RISK" valueClass="text-white font-bold bg-danger-500 px-2.5 py-0.5 rounded-full text-xs" />
              </div>

              <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  This code was not found in the VerifyGH product registry. The product may be counterfeit, unregistered, or the code may have been tampered with.
                  <span className="font-semibold text-danger-500"> Do not purchase or consume this product.</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Action Buttons ─────────────────────────────────────────────── */}
        <div className="space-y-2.5 pt-1">
          {/* Report — always visible but styled differently per state */}
          {showReport ? (
            <button
              onClick={() => onReport(reportName)}
              className={`w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] shadow-sm
                ${state === 'not_registered'
                  ? 'bg-danger-500 hover:bg-danger-600 text-white shadow-danger-500/20'
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'}
              `}
            >
              <Flag className="w-5 h-5" />
              Report Counterfeit
            </button>
          ) : (
            <button
              onClick={() => onReport(reportName)}
              className="w-full py-3.5 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
            >
              <Flag className="w-4.5 h-4.5" />
              Report Counterfeit
            </button>
          )}

          {/* Scan Another — always primary/prominent */}
          <button
            onClick={onScanAgain}
            className="w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] bg-primary hover:bg-primary-dark text-white shadow-md shadow-primary/25"
          >
            <ScanLine className="w-5 h-5" />
            Scan Another Product
          </button>

          {/* WhatsApp share */}
          <button
            onClick={shareWhatsApp}
            className="w-full py-3.5 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            <Share2 className="w-4.5 h-4.5" />
            Share on WhatsApp
          </button>
        </div>

        {/* ── Official footer ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-2 py-2">
          <ShieldCheck className="w-3.5 h-3.5 text-gray-300" />
          <p className="text-[10px] text-gray-400">
            Issued by <span className="font-semibold">VerifyGH</span> · Ghana Product Authentication Platform
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FDABadge({
  approved,
  cfg,
}: {
  approved: boolean;
  cfg: typeof STATE_CONFIG[ResultState];
}) {
  if (approved) {
    return (
      <span className={`flex-shrink-0 flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-full ${cfg.fdaBadgeBg} ${cfg.fdaBadgeText}`}>
        <BadgeCheck className="w-3.5 h-3.5" />
        FDA
      </span>
    );
  }
  return (
    <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-full bg-amber-50 text-amber-600">
      <AlertOctagon className="w-3.5 h-3.5" />
      Pending
    </span>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  warning,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  warning?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-gray-400" />
        <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-sm font-semibold leading-tight ${warning ? 'text-danger-500' : 'text-gray-800'}`}>
        {value}
        {warning && <span className="ml-1 text-[10px] font-bold bg-danger-100 text-danger-500 px-1.5 py-0.5 rounded-full">{warning}</span>}
      </p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass: string;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
