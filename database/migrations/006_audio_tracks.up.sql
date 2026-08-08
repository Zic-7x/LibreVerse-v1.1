-- Migration: 006_audio_tracks.up.sql
-- Table for creative audio track catalog

CREATE TABLE IF NOT EXISTS audio_tracks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  artist           TEXT,
  source_media_id  UUID NOT NULL REFERENCES media (id) ON DELETE RESTRICT,
  duration_ms      INTEGER NOT NULL CHECK (duration_ms > 0),
  waveform_json    JSONB,
  license_type     TEXT NOT NULL DEFAULT 'platform_library',
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE audio_tracks IS 'Catalog of audio tracks available for attachment to media.';
COMMENT ON COLUMN audio_tracks.source_media_id IS 'Media asset containing the audio track source.';
COMMENT ON COLUMN audio_tracks.duration_ms IS 'Track duration in milliseconds.';
COMMENT ON COLUMN audio_tracks.waveform_json IS 'Optional waveform data used for client-side audio previews.';
COMMENT ON COLUMN audio_tracks.license_type IS 'Usage license classification for the audio track.';
COMMENT ON COLUMN audio_tracks.is_active IS 'Whether the audio track is available for new media attachments.';

CREATE INDEX IF NOT EXISTS audio_tracks_title_idx ON audio_tracks (title);
CREATE INDEX IF NOT EXISTS audio_tracks_active_idx ON audio_tracks (is_active);
