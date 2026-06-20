-- ═══════════════════════════════════════════════════════════
-- VerifyGH: Contact form submissions
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS contact_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  email      text NOT NULL,
  phone      text,
  subject    text NOT NULL,
  message    text NOT NULL,
  status     text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can submit the contact form (public)
CREATE POLICY "public_insert_contact_messages"
  ON contact_messages FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read/update submissions
CREATE POLICY "admin_select_contact_messages"
  ON contact_messages FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_update_contact_messages"
  ON contact_messages FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
