PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    report_type TEXT NOT NULL,
    period_start TEXT,
    period_end TEXT,
    title TEXT NOT NULL,
    summary_text TEXT,
    status TEXT NOT NULL DEFAULT 'ready',
    report_payload_json TEXT,
    generated_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reports_user_type
ON reports(user_id, report_type);

CREATE INDEX IF NOT EXISTS idx_reports_period
ON reports(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_reports_generated_at
ON reports(generated_at);
