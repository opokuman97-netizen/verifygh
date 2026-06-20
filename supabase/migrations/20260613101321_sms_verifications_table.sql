-- ═══════════════════════════════════════════════════════════
-- VerifyGH: SMS Verification logging table
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS sms_verifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  message_received text NOT NULL,
  product_code text,
  result       text NOT NULL DEFAULT 'not_found'
               CHECK (result IN ('authentic', 'warning', 'not_found')),
  product_name text,
  reply_sent   text,
  provider     text,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sms_verifications_created_at ON sms_verifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_verifications_phone ON sms_verifications(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_verifications_result ON sms_verifications(result);

ALTER TABLE sms_verifications ENABLE ROW LEVEL SECURITY;

-- Only admins can read SMS logs (privacy: phone numbers are PII)
CREATE POLICY "admin_select_sms_verifications"
  ON sms_verifications FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Service role (Edge Function) inserts via service_role key — no policy needed
-- but add anon insert for the edge function which may not use authenticated context
CREATE POLICY "service_insert_sms_verifications"
  ON sms_verifications FOR INSERT TO anon, authenticated
  WITH CHECK (true);
