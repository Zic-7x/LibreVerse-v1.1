-- Migration: 008_media_overlays_audio.down.sql
DROP TABLE IF EXISTS media_audio_tracks CASCADE;
DROP TABLE IF EXISTS media_overlays CASCADE;
