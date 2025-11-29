-- OSIA Compliance Migration
-- Adds transaction_id and attributes fields for OSIA v1.2.0 compliance
-- Database: osia_dev
-- PostgreSQL 13+

-- Add transaction_id field for OSIA transaction tracking
ALTER TABLE uin_pool ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- Add attributes field to store OSIA person attributes (firstName, lastName, dateOfBirth, etc.)
ALTER TABLE uin_pool ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::JSONB;

-- Create index for transaction ID lookups
CREATE INDEX IF NOT EXISTS idx_uin_pool_transaction_id ON uin_pool(transaction_id);

-- Add comments for documentation
COMMENT ON COLUMN uin_pool.transaction_id IS 'OSIA transaction ID for tracking (from generateUIN request)';
COMMENT ON COLUMN uin_pool.attributes IS 'OSIA person attributes used during generation (firstName, lastName, dateOfBirth, etc.)';
