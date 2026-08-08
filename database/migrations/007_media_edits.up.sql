-- Migration: 007_media_edits.up.sql
-- Table for persisted media edit state

CREATE TABLE IF NOT EXISTS media_edits (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id          UUID NOT NULL UNIQUE REFERENCES media (id) ON DELETE CASCADE,
  filter_preset_id  UUID REFERENCES filter_presets (id) ON DELETE SET NULL,
  crop              JSONB,
  trim_start_ms     INTEGER,
  trim_end_ms       INTEGER,
  speed             NUMERIC(3,2) NOT NULL DEFAULT 1.0 CHECK (speed > 0),
  effects           JSONB NOT NULL DEFAULT '[]',
  created_by        UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT media_edits_trim_end_after_start
    CHECK (trim_end_ms IS NULL OR trim_end_ms > trim_start_ms)
);

COMMENT ON TABLE media_edits IS 'Persisted, non-destructive creative editing state for a media asset.';
COMMENT ON COLUMN media_edits.media_id IS 'Edited media asset; one edit state is stored per media item.';
COMMENT ON COLUMN media_edits.filter_preset_id IS 'Optional creative filter preset selected for the media item.';
COMMENT ON COLUMN media_edits.crop IS 'Optional structured crop bounds for client-side rendering.';
COMMENT ON COLUMN media_edits.trim_start_ms IS 'Optional video trim start offset in milliseconds.';
COMMENT ON COLUMN media_edits.trim_end_ms IS 'Optional video trim end offset in milliseconds.';
COMMENT ON COLUMN media_edits.speed IS 'Playback speed multiplier for video rendering.';
COMMENT ON COLUMN media_edits.effects IS 'Ordered list of effect and transition tag strings.';
COMMENT ON COLUMN media_edits.created_by IS 'User who created the media edit state.';

DROP TRIGGER IF EXISTS media_edits_set_updated_at ON media_edits;
CREATE TRIGGER media_edits_set_updated_at
  BEFORE UPDATE ON media_edits FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
