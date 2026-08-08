-- Migration: 007_media_edits.down.sql
DROP TRIGGER IF EXISTS media_edits_set_updated_at ON media_edits;
DROP TABLE IF EXISTS media_edits CASCADE;
