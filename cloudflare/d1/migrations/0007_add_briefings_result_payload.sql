PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS briefings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    briefing_date TEXT NOT NULL,
    briefing_type TEXT NOT NULL,
    issue_number INTEGER,
    title TEXT,
    summary_text TEXT,
    payload TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_briefings_user_date
ON briefings(user_id, briefing_date);

CREATE INDEX IF NOT EXISTS idx_briefings_user_type
ON briefings(user_id, briefing_type);
