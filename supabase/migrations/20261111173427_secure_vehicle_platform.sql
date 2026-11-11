-- New Supabase project. Application data is deliberately not exposed by the Data API.
BEGIN;
CREATE SCHEMA benz;
REVOKE ALL ON SCHEMA benz FROM PUBLIC, anon, authenticated;
CREATE TABLE benz.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE benz.login_guards (
  key text PRIMARY KEY, failures integer NOT NULL DEFAULT 0 CHECK (failures BETWEEN 0 AND 5),
  locked boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE benz.sessions (
  token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES benz.profiles(id) ON DELETE CASCADE,
  encrypted_tokens text NOT NULL, purpose text NOT NULL DEFAULT 'login' CHECK (purpose IN ('login','recovery')),
  mfa_factor_id uuid, mfa_challenge_id uuid,
  last_activity timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user ON benz.sessions(user_id);
CREATE INDEX sessions_activity ON benz.sessions(last_activity);
CREATE TABLE benz.orders (
  id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES benz.profiles(id),
  request_key uuid NOT NULL, plate text NOT NULL CHECK (plate ~ '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$'),
  amount_cents integer NOT NULL DEFAULT 5000 CHECK (amount_cents = 5000),
  currency text NOT NULL DEFAULT 'BRL' CHECK (currency = 'BRL'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled','refunded','charged_back','in_mediation')),
  preference_id text UNIQUE, checkout_url text, mp_payment_id text UNIQUE,
  report_state text NOT NULL DEFAULT 'available' CHECK (report_state IN ('available','processing','complete','review')),
  query_started_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 minutes',
  updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,request_key), UNIQUE(id,user_id)
);
CREATE INDEX orders_user_date ON benz.orders(user_id,created_at DESC);
CREATE TABLE benz.reports (
  order_id uuid PRIMARY KEY, user_id uuid NOT NULL, report_json jsonb NOT NULL,
  consulted_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (order_id,user_id) REFERENCES benz.orders(id,user_id)
);
CREATE TABLE benz.webhook_jobs (
  payment_id text PRIMARY KEY, received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz, attempts integer NOT NULL DEFAULT 0, last_error text
);
CREATE TABLE benz.support_requests (
  id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES benz.profiles(id),
  order_id uuid NOT NULL, kind text NOT NULL CHECK (kind IN ('refund','error')),
  message text NOT NULL CHECK (length(message) BETWEEN 10 AND 2000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(order_id,user_id) REFERENCES benz.orders(id,user_id)
);
CREATE UNIQUE INDEX one_open_support_request ON benz.support_requests(order_id,kind) WHERE status='open';
CREATE TABLE benz.rate_limits (key text PRIMARY KEY, hits integer NOT NULL, reset_at timestamptz NOT NULL);

-- Defense in depth: no browser or Supabase JWT can read sessions, purchases or reports.
ALTER TABLE benz.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE benz.login_guards ENABLE ROW LEVEL SECURITY;
ALTER TABLE benz.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE benz.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE benz.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE benz.webhook_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE benz.support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE benz.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA benz FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA benz FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA benz REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
COMMIT;
