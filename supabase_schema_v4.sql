-- ─── Notes (sticky notes board) ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  topic      TEXT NOT NULL DEFAULT 'New Note',
  content    TEXT NOT NULL DEFAULT '',
  color      TEXT NOT NULL DEFAULT '#fef9c3',
  pos_x      NUMERIC NOT NULL DEFAULT 32,
  pos_y      NUMERIC NOT NULL DEFAULT 32,
  rotation   NUMERIC NOT NULL DEFAULT 0,
  z_index    INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes (user_id);
