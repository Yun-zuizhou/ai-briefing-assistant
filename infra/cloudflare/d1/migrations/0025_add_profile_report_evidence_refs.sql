PRAGMA foreign_keys = ON;

ALTER TABLE user_profiles
ADD COLUMN status TEXT NOT NULL DEFAULT 'ready'
CHECK(status IN ('ready', 'failed'));

ALTER TABLE user_profiles
ADD COLUMN provider_name TEXT;

ALTER TABLE user_profiles
ADD COLUMN model_name TEXT;

ALTER TABLE user_profiles
ADD COLUMN evidence_refs_json TEXT NOT NULL DEFAULT '[]'
CHECK(json_valid(evidence_refs_json));

ALTER TABLE user_profiles
ADD COLUMN error_message TEXT;

ALTER TABLE reports
ADD COLUMN evidence_refs_json TEXT NOT NULL DEFAULT '[]'
CHECK(json_valid(evidence_refs_json));

ALTER TABLE reports
ADD COLUMN generation_source TEXT NOT NULL DEFAULT 'rules'
CHECK(generation_source IN ('rules', 'llm'));

ALTER TABLE reports
ADD COLUMN provider_name TEXT;

ALTER TABLE reports
ADD COLUMN model_name TEXT;

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_generated
ON user_profiles(user_id, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_generation_source
ON reports(generation_source, generated_at DESC);
