PRAGMA foreign_keys = ON;

ALTER TABLE briefings ADD COLUMN status TEXT NOT NULL DEFAULT 'ready';
ALTER TABLE briefings ADD COLUMN generated_at TEXT;

UPDATE briefings
SET status = COALESCE(status, 'ready')
WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS idx_briefings_generated_at
ON briefings(generated_at);
