PRAGMA foreign_keys = ON;

-- Historical note:
-- The user_settings alignment fields were folded into 0001_init_schema.sql.
-- This migration remains only to preserve the original migration chain for
-- legacy databases that may still miss user_interests or its indexes.

CREATE TABLE IF NOT EXISTS user_interests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    interest_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, interest_name)
);

CREATE INDEX IF NOT EXISTS idx_user_interests_user_id
ON user_interests(user_id);

CREATE INDEX IF NOT EXISTS idx_user_interests_interest_name
ON user_interests(interest_name);
