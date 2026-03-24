CREATE SCHEMA IF NOT EXISTS audit_logs;

CREATE TABLE IF NOT EXISTS audit_logs.event_logs (
  id UUID PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  service_name TEXT NOT NULL,
  aggregate_id TEXT,
  order_id TEXT,
  user_id TEXT,
  payload JSONB NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  correlation_id TEXT NOT NULL,
  version TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_event_logs_user_id ON audit_logs.event_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_event_logs_order_id ON audit_logs.event_logs (order_id);
CREATE INDEX IF NOT EXISTS idx_event_logs_service_name ON audit_logs.event_logs (service_name);
CREATE INDEX IF NOT EXISTS idx_event_logs_event_type ON audit_logs.event_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_event_logs_occurred_at ON audit_logs.event_logs (occurred_at);
