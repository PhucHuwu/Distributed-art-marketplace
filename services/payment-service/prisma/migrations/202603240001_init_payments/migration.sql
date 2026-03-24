CREATE SCHEMA IF NOT EXISTS payments;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'PaymentStatus' AND n.nspname = 'payments') THEN
    CREATE TYPE payments."PaymentStatus" AS ENUM ('INITIATED', 'PROCESSING', 'SUCCESS', 'FAILED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS payments.payments (
  id UUID PRIMARY KEY,
  order_id TEXT NOT NULL,
  user_id TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL,
  provider TEXT NOT NULL,
  status payments."PaymentStatus" NOT NULL,
  correlation_id TEXT NOT NULL,
  provider_reference TEXT,
  failure_code TEXT,
  failure_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS payments.payment_status_histories (
  id UUID PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES payments.payments(id) ON DELETE CASCADE,
  from_status payments."PaymentStatus",
  to_status payments."PaymentStatus" NOT NULL,
  reason TEXT,
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments.payments (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments.payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_correlation_id ON payments.payments (correlation_id);
CREATE INDEX IF NOT EXISTS idx_payment_status_histories_payment_id ON payments.payment_status_histories (payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_status_histories_created_at ON payments.payment_status_histories (created_at);
