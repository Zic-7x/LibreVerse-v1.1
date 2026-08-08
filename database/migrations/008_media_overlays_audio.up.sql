-- Migration: 008_media_overlays_audio.up.sql
-- Tables for media overlays and attached audio tracks

CREATE TABLE IF NOT EXISTS media_overlays (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_edit_id     UUID NOT NULL REFERENCES media_edits (id) ON DELETE CASCADE,
  overlay_type      overlay_type NOT NULL,
  sticker_asset_id  UUID REFERENCES sticker_assets (id) ON DELETE SET NULL,
  content           JSONB NOT NULL DEFAULT '{}',
  z_index           SMALLINT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE media_overlays IS 'Positioned creative overlays attached to a media edit state.';

CREATE INDEX IF NOT EXISTS media_overlays_media_edit_idx ON media_overlays (media_edit_id);

CREATE TABLE IF NOT EXISTS media_audio_tracks (
  media_id         UUID NOT NULL REFERENCES media (id) ON DELETE CASCADE,
  audio_track_id   UUID NOT NULL REFERENCES audio_tracks (id) ON DELETE RESTRICT,
  start_offset_ms  INTEGER NOT NULL DEFAULT 0,
  volume           NUMERIC(3,2) NOT NULL DEFAULT 1.0 CHECK (volume >= 0 AND volume <= 2),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (media_id, audio_track_id)
);

COMMENT ON TABLE media_audio_tracks IS 'Audio tracks attached to media with playback offset and volume metadata.';

CREATE INDEX IF NOT EXISTS media_audio_tracks_audio_track_idx ON media_audio_tracks (audio_track_id);
