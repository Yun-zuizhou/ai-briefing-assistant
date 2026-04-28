PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS summary_generation_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content_type TEXT,
    content_id INTEGER,
    source_url TEXT,
    title TEXT,
    summary_kind TEXT NOT NULL DEFAULT 'standard',
    status TEXT NOT NULL DEFAULT 'pending_provider',
    provider_name TEXT,
    model_name TEXT,
    result_ref TEXT,
    error_message TEXT,
    requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TEXT,
    finished_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_summary_generation_tasks_user_status
ON summary_generation_tasks(user_id, status, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_summary_generation_tasks_content
ON summary_generation_tasks(content_type, content_id, requested_at DESC);
