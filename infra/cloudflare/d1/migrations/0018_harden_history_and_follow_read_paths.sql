PRAGMA foreign_keys = ON;

UPDATE opportunity_follows
SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
WHERE updated_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_history_entries_user_created
ON history_entries(user_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_history_entries_user_event_created
ON history_entries(user_id, event_type, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_opportunity_follows_user_updated
ON opportunity_follows(user_id, updated_at DESC, id DESC);
