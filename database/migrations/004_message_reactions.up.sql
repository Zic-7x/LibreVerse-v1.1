-- Migration: 004_message_reactions.up.sql
-- Table for message reactions (emojis)

CREATE TABLE IF NOT EXISTS message_reactions (
  message_id  UUID NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  emoji       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS message_reactions_message_idx ON message_reactions (message_id);
