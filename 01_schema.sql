-- ============================================================
-- GOLFROOTS TRADE-IN SYSTEM — DATABASE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- ─── EXTENSIONS ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ─── TRADE-IN SUBMISSIONS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS trade_in_submissions (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  updated_at        timestamptz DEFAULT now() NOT NULL,
  ref_code          text        GENERATED ALWAYS AS (upper(substring(id::text, 1, 8))) STORED,

  -- Club details
  club_type         text        NOT NULL,
  brand             text        NOT NULL,
  model             text        NOT NULL,
  condition         text        NOT NULL
    CHECK (condition IN ('new','above_avg','avg','below_avg')),
  iron_config       text,
  missing_clubs     text[]      DEFAULT '{}',

  -- Valuation
  payment_type      text        NOT NULL
    CHECK (payment_type IN ('credit','cash')),
  quoted_cash       numeric(10,2),
  quoted_credit     numeric(10,2),
  member_code       text,
  member_bonus      numeric(5,4),

  -- Customer contact
  customer_name     text        NOT NULL,
  customer_email    text        NOT NULL,
  customer_phone    text,

  -- Cash-only fields
  address           text,
  bank_details      text,
  collection_date   date,

  -- Notes
  notes             text,

  -- Admin workflow
  status            text        DEFAULT 'pending' NOT NULL
    CHECK (status IN ('pending','reviewing','approved','rejected','shipped','complete')),
  admin_notes       text,
  reviewed_by       text,
  reviewed_at       timestamptz,

  -- Shopify integration
  shopify_customer_id  text,
  shopify_order_id     text,
  gift_card_code       text,
  gift_card_id         text,
  discount_code        text,
  shipping_label_url   text,
  tracking_number      text
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_submissions_status       ON trade_in_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_email        ON trade_in_submissions(customer_email);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at  ON trade_in_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_club_type   ON trade_in_submissions(club_type);
CREATE INDEX IF NOT EXISTS idx_submissions_payment     ON trade_in_submissions(payment_type);


-- ─── PRICING TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trade_in_pricing (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  club_type       text        NOT NULL,
  brand           text        NOT NULL,
  model           text        NOT NULL,
  price_new       numeric(10,2) NOT NULL,
  price_above_avg numeric(10,2) NOT NULL,
  price_avg       numeric(10,2) NOT NULL,
  price_below_avg numeric(10,2) NOT NULL,
  active          boolean     DEFAULT true NOT NULL,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL,
  updated_by      text,
  UNIQUE(club_type, brand, model)
);

CREATE INDEX IF NOT EXISTS idx_pricing_lookup
  ON trade_in_pricing(club_type, brand, active);


-- ─── MEMBER CODES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS member_codes (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  code        text        UNIQUE NOT NULL,
  label       text        NOT NULL,
  bonus       numeric(5,4) NOT NULL CHECK (bonus > 0 AND bonus <= 1),
  active      boolean     DEFAULT true NOT NULL,
  max_uses    integer,
  uses_count  integer     DEFAULT 0 NOT NULL,
  expires_at  timestamptz,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_codes_lookup ON member_codes(code, active);


-- ─── ADMIN USERS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  email         text        UNIQUE NOT NULL,
  name          text        NOT NULL,
  password_hash text        NOT NULL,
  role          text        DEFAULT 'admin' CHECK (role IN ('admin','superadmin')),
  active        boolean     DEFAULT true,
  last_login    timestamptz,
  created_at    timestamptz DEFAULT now() NOT NULL
);


-- ─── AUDIT LOG ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now() NOT NULL,
  table_name    text        NOT NULL,
  record_id     uuid        NOT NULL,
  action        text        NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  old_data      jsonb,
  new_data      jsonb,
  changed_by    text,
  ip_address    inet
);

CREATE INDEX IF NOT EXISTS idx_audit_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);


-- ─── AUTO-UPDATE updated_at TRIGGER ──────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trig_submissions_updated_at
  BEFORE UPDATE ON trade_in_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trig_pricing_updated_at
  BEFORE UPDATE ON trade_in_pricing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trig_codes_updated_at
  BEFORE UPDATE ON member_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ─── AUDIT TRIGGER ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log(table_name, record_id, action, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log(table_name, record_id, action, old_data, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log(table_name, record_id, action, old_data)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trig_audit_submissions
  AFTER INSERT OR UPDATE OR DELETE ON trade_in_submissions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE OR REPLACE TRIGGER trig_audit_pricing
  AFTER INSERT OR UPDATE OR DELETE ON trade_in_pricing
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE OR REPLACE TRIGGER trig_audit_codes
  AFTER INSERT OR UPDATE OR DELETE ON member_codes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();


-- ─── ANALYTICS VIEW ──────────────────────────────────────────
CREATE OR REPLACE VIEW submission_stats AS
SELECT
  date_trunc('day', created_at)       AS day,
  count(*)                            AS total,
  count(*) FILTER (WHERE status = 'pending')   AS pending,
  count(*) FILTER (WHERE status = 'approved')  AS approved,
  count(*) FILTER (WHERE status = 'rejected')  AS rejected,
  count(*) FILTER (WHERE status = 'complete')  AS complete,
  count(*) FILTER (WHERE payment_type = 'credit') AS credit_count,
  count(*) FILTER (WHERE payment_type = 'cash')   AS cash_count,
  avg(quoted_cash)  FILTER (WHERE payment_type = 'cash')   AS avg_cash_value,
  avg(quoted_credit) FILTER (WHERE payment_type = 'credit') AS avg_credit_value
FROM trade_in_submissions
GROUP BY date_trunc('day', created_at)
ORDER BY day DESC;
