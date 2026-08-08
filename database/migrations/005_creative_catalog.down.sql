-- Migration: 005_creative_catalog.down.sql
DROP TABLE IF EXISTS sticker_assets CASCADE;
DROP TABLE IF EXISTS filter_presets CASCADE;
DROP TYPE IF EXISTS overlay_type;
DROP TYPE IF EXISTS filter_category;
