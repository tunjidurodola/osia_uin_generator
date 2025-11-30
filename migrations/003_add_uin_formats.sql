-- OSIA UIN Generator - UIN Format Configuration
-- Migration: 003_add_uin_formats
--
-- This table stores display format rules for UINs rather than storing
-- pre-formatted UINs. This is more efficient as millions of UINs can
-- share the same format configuration.
--
-- Example: A format with pattern "XXXXX.XXXX.XXXX.XXXX.XX" (19 chars, dots every 5/4/4/4/2)
-- would be stored once and applied at display time to all matching UINs.

-- UIN Format Configuration Table
CREATE TABLE IF NOT EXISTS uin_formats (
  id               SERIAL PRIMARY KEY,
  format_code      VARCHAR(50) NOT NULL UNIQUE,          -- e.g. 'OSIA_STANDARD', 'HEALTH_SECTOR', 'TAX_ID'
  name             VARCHAR(100) NOT NULL,                 -- human-readable name
  description      TEXT,                                  -- detailed description

  -- Format specification
  separator        VARCHAR(5) DEFAULT '',                 -- separator character(s), e.g. '.', '-', ' '
  segment_lengths  INTEGER[] NOT NULL,                    -- array of segment lengths, e.g. {5,4,4,4,2} for XXXXX.XXXX.XXXX.XXXX.XX
  total_length     INTEGER NOT NULL,                      -- expected raw UIN length (without separators)

  -- Display options
  display_case     VARCHAR(10) DEFAULT 'upper',           -- 'upper', 'lower', 'preserve'
  prefix           VARCHAR(20) DEFAULT '',                -- optional prefix, e.g. 'UIN-', 'NIN:'
  suffix           VARCHAR(20) DEFAULT '',                -- optional suffix

  -- Validation
  is_default       BOOLEAN DEFAULT false,                 -- if true, this is the default format for new UINs
  applies_to_scope VARCHAR(50),                           -- if set, auto-apply to UINs of this scope (e.g. 'health', 'tax')
  applies_to_mode  VARCHAR(50),                           -- if set, auto-apply to UINs of this mode

  -- Metadata
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by       VARCHAR(100) DEFAULT 'SYSTEM'
);

-- Link table to associate UIN pool entries with formats (optional override)
-- If a UIN doesn't have an entry here, the default format or scope-based format applies
CREATE TABLE IF NOT EXISTS uin_format_overrides (
  uin              VARCHAR(32) PRIMARY KEY REFERENCES uin_pool(uin) ON DELETE CASCADE,
  format_id        INTEGER NOT NULL REFERENCES uin_formats(id) ON DELETE RESTRICT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_uin_formats_scope ON uin_formats(applies_to_scope) WHERE applies_to_scope IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_uin_formats_mode ON uin_formats(applies_to_mode) WHERE applies_to_mode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_uin_formats_default ON uin_formats(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_uin_format_overrides_format ON uin_format_overrides(format_id);

-- Insert default formats
INSERT INTO uin_formats (format_code, name, description, separator, segment_lengths, total_length, is_default, applies_to_mode)
VALUES
  ('OSIA_STANDARD', 'OSIA Standard Format', 'Standard 19-character UIN with dot separators: XXXXX.XXXX.XXXX.XXXX.XX', '.', '{5,4,4,4,2}', 19, true, 'foundational'),
  ('OSIA_COMPACT', 'OSIA Compact Format', 'Compact 19-character UIN without separators', '', '{19}', 19, false, NULL),
  ('OSIA_DASHED', 'OSIA Dashed Format', 'Standard 19-character UIN with dash separators: XXXXX-XXXX-XXXX-XXXX-XX', '-', '{5,4,4,4,2}', 19, false, NULL),
  ('OSIA_SPACED', 'OSIA Spaced Format', 'Standard 19-character UIN with space separators: XXXXX XXXX XXXX XXXX XX', ' ', '{5,4,4,4,2}', 19, false, NULL),
  ('HEALTH_ID', 'Health Sector ID', 'Health sector format with HLT prefix: HLT-XXXXXXXX-XXXX', '-', '{8,4}', 12, false, 'sector_token'),
  ('TAX_ID', 'Tax Identification Number', 'Tax sector format: XXX-XX-XXXX', '-', '{3,2,4}', 9, false, 'sector_token'),
  ('SHORT_ID', 'Short Identifier', 'Short 12-character ID with dashes: XXXX-XXXX-XXXX', '-', '{4,4,4}', 12, false, 'random')
ON CONFLICT (format_code) DO NOTHING;

-- Comments
COMMENT ON TABLE uin_formats IS 'UIN display format configurations - stores formatting rules rather than pre-formatted UINs';
COMMENT ON TABLE uin_format_overrides IS 'Optional per-UIN format overrides';
COMMENT ON COLUMN uin_formats.segment_lengths IS 'Array of segment lengths defining how to split the UIN, e.g. {5,4,4,4,2} creates XXXXX.XXXX.XXXX.XXXX.XX';
COMMENT ON COLUMN uin_formats.separator IS 'Character(s) inserted between segments';
COMMENT ON COLUMN uin_formats.applies_to_scope IS 'Auto-apply this format to UINs with matching scope';
COMMENT ON COLUMN uin_formats.applies_to_mode IS 'Auto-apply this format to UINs with matching generation mode';

-- Function to format a UIN according to a format specification
CREATE OR REPLACE FUNCTION format_uin(
  p_uin VARCHAR(32),
  p_format_id INTEGER DEFAULT NULL
) RETURNS VARCHAR(100) AS $$
DECLARE
  v_format uin_formats%ROWTYPE;
  v_result VARCHAR(100);
  v_pos INTEGER := 1;
  v_segment_len INTEGER;
  v_uin_upper VARCHAR(32);
BEGIN
  -- Get format (by ID or default)
  IF p_format_id IS NOT NULL THEN
    SELECT * INTO v_format FROM uin_formats WHERE id = p_format_id;
  ELSE
    SELECT * INTO v_format FROM uin_formats WHERE is_default = true LIMIT 1;
  END IF;

  -- If no format found, return UIN as-is
  IF NOT FOUND THEN
    RETURN p_uin;
  END IF;

  -- Apply case transformation
  CASE v_format.display_case
    WHEN 'upper' THEN v_uin_upper := UPPER(p_uin);
    WHEN 'lower' THEN v_uin_upper := LOWER(p_uin);
    ELSE v_uin_upper := p_uin;
  END CASE;

  -- Build formatted string from segments
  v_result := v_format.prefix;

  FOR i IN 1..array_length(v_format.segment_lengths, 1) LOOP
    v_segment_len := v_format.segment_lengths[i];

    -- Add separator before segment (except first)
    IF i > 1 AND v_format.separator != '' THEN
      v_result := v_result || v_format.separator;
    END IF;

    -- Add segment
    v_result := v_result || SUBSTRING(v_uin_upper FROM v_pos FOR v_segment_len);
    v_pos := v_pos + v_segment_len;
  END LOOP;

  v_result := v_result || v_format.suffix;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get the appropriate format for a UIN
CREATE OR REPLACE FUNCTION get_uin_format(
  p_uin VARCHAR(32)
) RETURNS INTEGER AS $$
DECLARE
  v_format_id INTEGER;
  v_scope VARCHAR(50);
  v_mode VARCHAR(50);
BEGIN
  -- Check for override first
  SELECT format_id INTO v_format_id
  FROM uin_format_overrides
  WHERE uin = p_uin;

  IF FOUND THEN
    RETURN v_format_id;
  END IF;

  -- Get UIN's scope and mode
  SELECT scope, mode INTO v_scope, v_mode
  FROM uin_pool
  WHERE uin = p_uin;

  -- Try to find format by scope
  IF v_scope IS NOT NULL THEN
    SELECT id INTO v_format_id
    FROM uin_formats
    WHERE applies_to_scope = v_scope
    LIMIT 1;

    IF FOUND THEN
      RETURN v_format_id;
    END IF;
  END IF;

  -- Try to find format by mode
  IF v_mode IS NOT NULL THEN
    SELECT id INTO v_format_id
    FROM uin_formats
    WHERE applies_to_mode = v_mode
    LIMIT 1;

    IF FOUND THEN
      RETURN v_format_id;
    END IF;
  END IF;

  -- Return default format
  SELECT id INTO v_format_id
  FROM uin_formats
  WHERE is_default = true
  LIMIT 1;

  RETURN v_format_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Convenience function: format UIN with auto-detected format
CREATE OR REPLACE FUNCTION format_uin_auto(p_uin VARCHAR(32)) RETURNS VARCHAR(100) AS $$
BEGIN
  RETURN format_uin(p_uin, get_uin_format(p_uin));
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION format_uin IS 'Format a UIN according to a specific format configuration';
COMMENT ON FUNCTION get_uin_format IS 'Get the appropriate format ID for a UIN (checks overrides, scope, mode, then default)';
COMMENT ON FUNCTION format_uin_auto IS 'Format a UIN with auto-detected format based on scope/mode/override';
