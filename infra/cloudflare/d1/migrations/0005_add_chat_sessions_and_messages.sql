PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS chat_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_title TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    source_context TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    last_message_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id
ON chat_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_status
ON chat_sessions(status);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message_at
ON chat_sessions(last_message_at);

CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    message_state TEXT,
    intent_type TEXT,
    candidate_intents_json TEXT NOT NULL DEFAULT '[]',
    confidence REAL,
    source_context TEXT,
    matched_by TEXT,
    confirmed_type TEXT,
    action_type TEXT,
    result_summary TEXT,
    deep_link TEXT,
    next_page_label TEXT,
    affected_entity_type TEXT,
    affected_entity_id TEXT,
    change_log_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id
ON chat_messages(session_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_role
ON chat_messages(role);

CREATE INDEX IF NOT EXISTS idx_chat_messages_message_state
ON chat_messages(message_state);
