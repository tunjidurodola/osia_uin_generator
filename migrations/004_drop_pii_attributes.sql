-- PII Purge — remove the `attributes` JSONB column from uin_pool.
--
-- Migration 002 added this column documented to hold OSIA person attributes
-- (firstName, lastName, dateOfBirth, etc.). That is PII and violates the
-- project's invariant that the UIN Generator contains no PII — a UIN
-- linked to person attributes is a national-ID record in disguise.
--
-- Code never wrote to this column (confirmed via grep), so dropping it is
-- lossless. If downstream services need to *correlate* a UIN with a
-- transaction, they should use the already-present `transaction_id`
-- column which is an opaque correlator, not PII.
--
-- PostgreSQL 13+

ALTER TABLE uin_pool DROP COLUMN IF EXISTS attributes;
