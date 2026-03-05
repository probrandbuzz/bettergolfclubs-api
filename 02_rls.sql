-- ============================================================
-- GOLFROOTS — ROW LEVEL SECURITY POLICIES
-- Run after 01_schema.sql
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE trade_in_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_in_pricing     ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_codes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log            ENABLE ROW LEVEL SECURITY;

-- ─── SUBMISSIONS ─────────────────────────────────────────────
-- Anon: insert only (form submissions from the website)
CREATE POLICY "anon_insert_submissions"
  ON trade_in_submissions FOR INSERT TO anon
  WITH CHECK (true);

-- Authenticated (admin panel): full access via service_role key
-- (service_role bypasses RLS, no policy needed for admin)


-- ─── PRICING ─────────────────────────────────────────────────
-- Anon: read active pricing (powers the live calculator)
CREATE POLICY "anon_read_active_pricing"
  ON trade_in_pricing FOR SELECT TO anon
  USING (active = true);

-- Authenticated: read all (including inactive)
CREATE POLICY "auth_read_all_pricing"
  ON trade_in_pricing FOR SELECT TO authenticated
  USING (true);


-- ─── MEMBER CODES ────────────────────────────────────────────
-- Anon: read only valid, non-expired, not-exhausted codes
-- (for server-side validation in the API route)
CREATE POLICY "anon_validate_codes"
  ON member_codes FOR SELECT TO anon
  USING (
    active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR uses_count < max_uses)
  );


-- ─── ADMIN USERS ─────────────────────────────────────────────
-- No public access to admin_users table
-- Only accessible via service_role key from the API

-- ─── AUDIT LOG ───────────────────────────────────────────────
-- No public access to audit log
-- Only accessible via service_role key from the API
