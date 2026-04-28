PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS feedback_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    feedback_type TEXT NOT NULL DEFAULT 'suggestion'
        CHECK (feedback_type IN ('bug', 'suggestion', 'other')),
    content TEXT NOT NULL,
    source_page TEXT,
    status TEXT NOT NULL DEFAULT 'submitted'
        CHECK (status IN ('submitted', 'reviewed', 'resolved')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_feedback_submissions_user_created
ON feedback_submissions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_submissions_status_created
ON feedback_submissions(status, created_at DESC);
