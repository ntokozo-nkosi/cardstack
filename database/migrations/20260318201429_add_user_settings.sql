-- +goose Up
-- +goose StatementBegin
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

CREATE OR REPLACE FUNCTION get_or_create_user_settings(p_user_id UUID)
RETURNS TABLE(settings JSONB) AS $$
BEGIN
  INSERT INTO user_settings (user_id, settings)
  VALUES (p_user_id, '{}')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN QUERY SELECT us.settings FROM user_settings us WHERE us.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_settings(p_user_id UUID, p_settings JSONB)
RETURNS TABLE(settings JSONB) AS $$
BEGIN
  INSERT INTO user_settings (user_id, settings, updated_at)
  VALUES (p_user_id, p_settings, CURRENT_TIMESTAMP)
  ON CONFLICT (user_id) DO UPDATE
  SET settings = user_settings.settings || p_settings,
      updated_at = CURRENT_TIMESTAMP;
  RETURN QUERY SELECT us.settings FROM user_settings us WHERE us.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP FUNCTION IF EXISTS update_user_settings;
DROP FUNCTION IF EXISTS get_or_create_user_settings;
DROP TABLE IF EXISTS user_settings;
-- +goose StatementEnd
