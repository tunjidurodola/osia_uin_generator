-- OSIA UIN Generator - Initial Schema
-- Database: osia_dev
-- PostgreSQL 13+

-- Create custom enum type for UIN lifecycle status
CREATE TYPE uin_status AS ENUM (
  'AVAILABLE',    -- pre-generated, not yet claimed
  'PREASSIGNED',  -- claimed by external system, not yet bound to PII
  'ASSIGNED',     -- bound to a PII record in Civil/Population Registry
  'RETIRED',      -- no longer in use (death, end-of-life)
  'REVOKED'       -- explicitly revoked (fraud, abuse, etc.)
);

-- Core table: uin_pool
-- Stores all generated UINs with their lifecycle state
CREATE TABLE uin_pool (
  uin              VARCHAR(32) PRIMARY KEY,           -- the UIN string itself
  mode             TEXT NOT NULL,                     -- "random" | "structured" | "foundational" | "sector_token"
  scope            TEXT,                              -- sector/purpose (e.g. foundational, health, tax, finance)

  iat              TIMESTAMPTZ NOT NULL DEFAULT now(), -- issued at (when generated)
  nbf              TIMESTAMPTZ,                        -- not before (valid from)
  exp              TIMESTAMPTZ,                        -- expiry (if any)
  status           uin_status NOT NULL DEFAULT 'AVAILABLE',
  ts               TIMESTAMPTZ NOT NULL DEFAULT now(), -- last status change timestamp

  hash_rmd160      CHAR(40) NOT NULL,                 -- RIPEMD-160 hash (hex) of UIN or UIN+salt
  cert_pem         TEXT,                              -- optional certificate or binding artifact (PEM)

  claimed_by       TEXT,                              -- system/client that pre-assigned (e.g. 'CIVIL_REGISTRY')
  claimed_at       TIMESTAMPTZ,                       -- when status became PREASSIGNED

  assigned_to_ref  TEXT,                              -- external reference ID (civil registry ID, person ID, etc.)
  assigned_at      TIMESTAMPTZ,                       -- when status became ASSIGNED

  transaction_id   TEXT,                              -- OSIA transaction ID for tracking (from generateUIN request)
  attributes       JSONB DEFAULT '{}'::JSONB,         -- OSIA person attributes used during generation
  meta             JSONB DEFAULT '{}'::JSONB          -- additional metadata
);

-- Indexes for efficient queries
CREATE INDEX idx_uin_pool_status ON uin_pool(status);
CREATE INDEX idx_uin_pool_scope_status ON uin_pool(scope, status);
CREATE INDEX idx_uin_pool_claimed_by_status ON uin_pool(claimed_by, status);
CREATE INDEX idx_uin_pool_exp ON uin_pool(exp);
CREATE INDEX idx_uin_pool_hash ON uin_pool(hash_rmd160);
CREATE INDEX idx_uin_pool_transaction_id ON uin_pool(transaction_id);

-- Audit table: uin_audit
-- Immutable audit log for all UIN lifecycle events
CREATE TABLE uin_audit (
  id               BIGSERIAL PRIMARY KEY,
  uin              VARCHAR(32) NOT NULL,
  event_type       TEXT NOT NULL,                     -- e.g. 'GENERATED', 'PREASSIGNED', 'ASSIGNED', 'RELEASED', 'RETIRED', 'REVOKED'
  old_status       uin_status,
  new_status       uin_status,
  actor_system     TEXT,                              -- caller / system identifier
  actor_ref        TEXT,                              -- external case/transaction reference if any
  details          JSONB DEFAULT '{}'::JSONB,         -- additional context (IP, reason, etc.)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for audit table
CREATE INDEX idx_uin_audit_uin ON uin_audit(uin);
CREATE INDEX idx_uin_audit_event_type ON uin_audit(event_type);
CREATE INDEX idx_uin_audit_created_at ON uin_audit(created_at);
CREATE INDEX idx_uin_audit_actor_system ON uin_audit(actor_system);

-- Comments for documentation
COMMENT ON TABLE uin_pool IS 'Core UIN pool with lifecycle management';
COMMENT ON TABLE uin_audit IS 'Immutable audit log for all UIN lifecycle events';
COMMENT ON TYPE uin_status IS 'UIN lifecycle states';
