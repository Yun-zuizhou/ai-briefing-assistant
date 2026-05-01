CREATE TRIGGER IF NOT EXISTS trg_user_settings_reject_plain_ai_api_key_insert
BEFORE INSERT ON user_settings
WHEN NEW.ai_api_key IS NOT NULL AND trim(NEW.ai_api_key) <> ''
BEGIN
  SELECT RAISE(ABORT, 'user_settings.ai_api_key is deprecated; store encrypted AI API keys only');
END;

CREATE TRIGGER IF NOT EXISTS trg_user_settings_reject_plain_ai_api_key_update
BEFORE UPDATE OF ai_api_key ON user_settings
WHEN NEW.ai_api_key IS NOT NULL AND trim(NEW.ai_api_key) <> ''
BEGIN
  SELECT RAISE(ABORT, 'user_settings.ai_api_key is deprecated; store encrypted AI API keys only');
END;
