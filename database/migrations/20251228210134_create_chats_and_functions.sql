-- +goose Up
-- +goose StatementBegin

-- Create chats table
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_updated_at ON chats(updated_at DESC);

-- Function: Get all chats for user as JSON array
CREATE OR REPLACE FUNCTION get_user_chats(p_user_id UUID)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(
      json_build_object(
        'id', id,
        'title', title,
        'createdAt', created_at,
        'updatedAt', updated_at
      ) ORDER BY updated_at DESC
    ), '[]'::json)
    FROM chats
    WHERE user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function: Get single chat by ID with ownership check
CREATE OR REPLACE FUNCTION get_chat_by_id(p_chat_id UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id', id,
    'title', title,
    'createdAt', created_at,
    'updatedAt', updated_at,
    'messages', '[]'::json  -- Empty for now, will be populated when messages are added
  ) INTO result
  FROM chats
  WHERE id = p_chat_id AND user_id = p_user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function: Create new chat
CREATE OR REPLACE FUNCTION create_chat(p_chat_id UUID, p_user_id UUID, p_title TEXT)
RETURNS JSON AS $$
DECLARE
  new_chat chats;
BEGIN
  INSERT INTO chats (id, user_id, title)
  VALUES (COALESCE(p_chat_id, gen_random_uuid()), p_user_id, p_title)
  RETURNING * INTO new_chat;

  RETURN json_build_object(
    'id', new_chat.id,
    'title', new_chat.title,
    'createdAt', new_chat.created_at,
    'updatedAt', new_chat.updated_at
  );
END;
$$ LANGUAGE plpgsql;

-- Function: Update chat title with ownership check
CREATE OR REPLACE FUNCTION update_chat_title(p_chat_id UUID, p_user_id UUID, p_title TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  UPDATE chats
  SET title = p_title, updated_at = CURRENT_TIMESTAMP
  WHERE id = p_chat_id AND user_id = p_user_id;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

-- Function: Delete chat with ownership check
CREATE OR REPLACE FUNCTION delete_chat_if_owned(p_chat_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  DELETE FROM chats
  WHERE id = p_chat_id AND user_id = p_user_id;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP FUNCTION IF EXISTS delete_chat_if_owned(UUID, UUID);
DROP FUNCTION IF EXISTS update_chat_title(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS create_chat(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS get_chat_by_id(UUID, UUID);
DROP FUNCTION IF EXISTS get_user_chats(UUID);
DROP TABLE IF EXISTS chats;

-- +goose StatementEnd
