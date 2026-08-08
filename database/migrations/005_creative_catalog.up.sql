-- Migration: 005_creative_catalog.up.sql
-- Tables for creative filter presets and sticker assets

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'filter_category') THEN CREATE TYPE filter_category AS ENUM ('color', 'vintage', 'bw', 'vivid', 'warm', 'cool'); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'overlay_type') THEN CREATE TYPE overlay_type AS ENUM ('text', 'sticker', 'emoji', 'drawing'); END IF; END $$;

CREATE TABLE IF NOT EXISTS filter_presets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  slug                CITEXT NOT NULL UNIQUE,
  category            filter_category NOT NULL DEFAULT 'color',
  config              JSONB NOT NULL DEFAULT '{}',
  thumbnail_media_id  UUID REFERENCES media (id) ON DELETE SET NULL,
  sort_order          SMALLINT NOT NULL DEFAULT 0,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE filter_presets IS 'Catalog of reusable creative filter configurations.';
COMMENT ON COLUMN filter_presets.slug IS 'Unique, URL-safe identifier for the filter preset.';
COMMENT ON COLUMN filter_presets.config IS 'Structured renderer configuration, such as CSS filter values.';
COMMENT ON COLUMN filter_presets.thumbnail_media_id IS 'Optional media asset used to preview the filter preset.';
COMMENT ON COLUMN filter_presets.sort_order IS 'Display order within the active filter catalog.';
COMMENT ON COLUMN filter_presets.is_active IS 'Whether the filter preset is available for new edits.';

CREATE INDEX IF NOT EXISTS filter_presets_active_sort_order_idx
  ON filter_presets (is_active, sort_order);

CREATE TABLE IF NOT EXISTS sticker_assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'general',
  media_id    UUID NOT NULL REFERENCES media (id) ON DELETE CASCADE,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE sticker_assets IS 'Catalog of media assets available as creative stickers.';
COMMENT ON COLUMN sticker_assets.category IS 'Grouping label used to browse sticker assets.';
COMMENT ON COLUMN sticker_assets.media_id IS 'Media asset rendered when the sticker is placed in an edit.';
COMMENT ON COLUMN sticker_assets.is_active IS 'Whether the sticker asset is available for new edits.';

CREATE INDEX IF NOT EXISTS sticker_assets_active_idx ON sticker_assets (is_active);
