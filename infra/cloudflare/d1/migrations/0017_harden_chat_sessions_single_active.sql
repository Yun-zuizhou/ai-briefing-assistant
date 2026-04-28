PRAGMA foreign_keys = ON;

CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_sessions_single_active
ON chat_sessions(user_id)
WHERE status = 'active';
