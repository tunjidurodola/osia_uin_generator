-- OSIA Compliance Migration
-- Adds transaction_id field for OSIA v1.2.0 compliance.
-- Database: osia_dev
-- PostgreSQL 13+

-- Add transaction_id field for OSIA transaction tracking.
-- An opaque correlator only — must NOT carry PII.
ALTER TABLE uin_pool ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- Historically this migration also added an `attributes` JSONB column
-- documented to hold person attributes (firstName, lastName, dateOfBirth).
-- That column is PII and violates the UIN Generator's no-PII invariant.
-- It is dropped by migration 004. For fresh installs the column is created
-- here and immediately dropped — cheap, lossless (no code ever wrote to it),
-- and keeps migration 002 byte-stable for anyone who already applied it.
ALTER TABLE uin_pool ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::JSONB;

-- Create index for transaction ID lookups
CREATE INDEX IF NOT EXISTS idx_uin_pool_transaction_id ON uin_pool(transaction_id);

-- Add comments for documentation
COMMENT ON COLUMN uin_pool.transaction_id IS 'OSIA transaction correlator — opaque, NOT PII';
COMMENT ON COLUMN uin_pool.attributes IS 'DEPRECATED — dropped by 004_drop_pii_attributes.sql (PII violation)';
