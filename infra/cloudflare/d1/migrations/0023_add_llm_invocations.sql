PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS llm_invocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    feature TEXT NOT NULL,
    request_ref TEXT,
    provider_name TEXT NOT NULL,
    provider_source TEXT NOT NULL,
    model_name TEXT NOT NULL,
    transport TEXT NOT NULL,
    status TEXT NOT NULL,
    duration_ms INTEGER,
    input_chars INTEGER,
    output_chars INTEGER,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    error_code TEXT,
    error_message TEXT,
    metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_llm_invocations_user_created
ON llm_invocations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_llm_invocations_feature_created
ON llm_invocations(feature, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_llm_invocations_status_created
ON llm_invocations(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_llm_invocations_request_ref
ON llm_invocations(request_ref);
