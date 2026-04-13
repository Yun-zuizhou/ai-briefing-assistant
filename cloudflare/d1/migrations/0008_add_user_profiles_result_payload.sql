PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    summary TEXT,
    profile_data TEXT,
    version TEXT,
    generated_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_version
ON user_profiles(version);

CREATE INDEX IF NOT EXISTS idx_user_profiles_generated_at
ON user_profiles(generated_at);
