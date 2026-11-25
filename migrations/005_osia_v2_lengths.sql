-- OSIA UIN Interface 2.0.0 field lengths.
--
-- api/uin.yaml allows canonical UINs of up to 128 characters, format codes of
-- up to 64 and format names of up to 128. Widening VARCHAR columns is a
-- catalogue-only change in PostgreSQL (no table rewrite, no index rebuild).
--
-- PostgreSQL 13+

ALTER TABLE uin_pool             ALTER COLUMN uin         TYPE VARCHAR(128);
ALTER TABLE uin_audit            ALTER COLUMN uin         TYPE VARCHAR(128);
ALTER TABLE uin_format_overrides ALTER COLUMN uin         TYPE VARCHAR(128);
ALTER TABLE uin_formats          ALTER COLUMN format_code TYPE VARCHAR(64);
ALTER TABLE uin_formats          ALTER COLUMN name        TYPE VARCHAR(128);
