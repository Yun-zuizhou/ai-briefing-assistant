PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS summary_generation_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    content_type TEXT,
    content_id INTEGER,
    source_url TEXT,
    result_ref TEXT NOT NULL UNIQUE,
    profile_id TEXT,
    provider_name TEXT,
    model_name TEXT,
    prompt_version TEXT,
    source_payload_json TEXT,
    summary_title TEXT,
    summary_text TEXT,
    key_points_json TEXT,
    risk_flags_json TEXT,
    consult_context_json TEXT,
    citations_json TEXT,
    raw_response_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    FOREIGN KEY (task_id) REFERENCES summary_generation_tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_summary_generation_results_user_created
ON summary_generation_results(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_summary_generation_results_profile_created
ON summary_generation_results(profile_id, created_at DESC);

