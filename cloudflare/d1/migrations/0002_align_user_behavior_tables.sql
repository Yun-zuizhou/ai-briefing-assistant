PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user_interests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    interest_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, interest_name)
);

CREATE INDEX IF NOT EXISTS idx_user_interests_user_id
ON user_interests(user_id);

CREATE INDEX IF NOT EXISTS idx_user_interests_interest_name
ON user_interests(interest_name);

ALTER TABLE user_settings ADD COLUMN morning_brief_time TEXT;
ALTER TABLE user_settings ADD COLUMN evening_brief_time TEXT;
ALTER TABLE user_settings ADD COLUMN do_not_disturb_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_settings ADD COLUMN sound_enabled INTEGER NOT NULL DEFAULT 1;
ALTER TABLE user_settings ADD COLUMN vibration_enabled INTEGER NOT NULL DEFAULT 1;

UPDATE user_settings
SET morning_brief_time = COALESCE(morning_brief_time, morning_briefing_time, '08:00')
WHERE morning_brief_time IS NULL;

UPDATE user_settings
SET evening_brief_time = COALESCE(evening_brief_time, evening_briefing_time, '21:00')
WHERE evening_brief_time IS NULL;

UPDATE user_settings
SET do_not_disturb_enabled = COALESCE(do_not_disturb_enabled, 0)
WHERE do_not_disturb_enabled IS NULL;

UPDATE user_settings
SET sound_enabled = COALESCE(sound_enabled, 1)
WHERE sound_enabled IS NULL;

UPDATE user_settings
SET vibration_enabled = COALESCE(vibration_enabled, 1)
WHERE vibration_enabled IS NULL;
