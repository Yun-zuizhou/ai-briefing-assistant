PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS opportunity_follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    opportunity_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'watching',
    note TEXT,
    next_step TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
    UNIQUE (user_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_opportunity_follows_user_status
ON opportunity_follows(user_id, status);
