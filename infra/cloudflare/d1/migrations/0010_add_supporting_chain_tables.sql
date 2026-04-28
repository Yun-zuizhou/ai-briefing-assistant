PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS briefing_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    briefing_type TEXT NOT NULL DEFAULT 'morning',
    schedule_time TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Asia/Shanghai',
    status TEXT NOT NULL DEFAULT 'active',
    next_run_at TEXT,
    last_triggered_at TEXT,
    updated_by TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, briefing_type)
);

CREATE INDEX IF NOT EXISTS idx_briefing_schedules_user_type
ON briefing_schedules(user_id, briefing_type);

CREATE TABLE IF NOT EXISTS briefing_dispatch_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_id INTEGER,
    user_id INTEGER NOT NULL,
    briefing_type TEXT NOT NULL,
    trigger_source TEXT NOT NULL,
    scheduled_for TEXT,
    dispatched_at TEXT,
    status TEXT NOT NULL DEFAULT 'queued',
    briefing_id INTEGER,
    summary TEXT,
    error_message TEXT,
    payload TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES briefing_schedules(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (briefing_id) REFERENCES briefings(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_briefing_dispatch_logs_user_created
ON briefing_dispatch_logs(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS opportunity_execution_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    opportunity_id INTEGER NOT NULL,
    todo_id INTEGER NOT NULL,
    follow_id INTEGER,
    result_status TEXT NOT NULL DEFAULT 'planned',
    result_note TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
    FOREIGN KEY (follow_id) REFERENCES opportunity_follows(id) ON DELETE SET NULL,
    UNIQUE (user_id, opportunity_id, todo_id)
);

CREATE INDEX IF NOT EXISTS idx_opportunity_execution_results_user_status
ON opportunity_execution_results(user_id, result_status);

CREATE TABLE IF NOT EXISTS ingestion_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pipeline_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'running',
    started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TEXT,
    stats_json TEXT,
    error_message TEXT,
    retry_of INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ingestion_runs_pipeline_status
ON ingestion_runs(pipeline_name, status, started_at DESC);

CREATE TABLE IF NOT EXISTS ai_processing_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_type TEXT NOT NULL,
    content_type TEXT,
    content_id INTEGER,
    status TEXT NOT NULL DEFAULT 'running',
    attempt INTEGER NOT NULL DEFAULT 1,
    tokens_used INTEGER,
    error_message TEXT,
    result_ref TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_ai_processing_runs_status
ON ai_processing_runs(status, created_at DESC);

CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chain_name TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT 'info',
    user_id INTEGER,
    request_id TEXT,
    message TEXT NOT NULL,
    payload TEXT,
    replayable INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_operation_logs_chain_time
ON operation_logs(chain_name, created_at DESC);

CREATE TABLE IF NOT EXISTS replay_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_log_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    requested_by INTEGER,
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    FOREIGN KEY (operation_log_id) REFERENCES operation_logs(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_replay_tasks_status
ON replay_tasks(status, created_at DESC);
