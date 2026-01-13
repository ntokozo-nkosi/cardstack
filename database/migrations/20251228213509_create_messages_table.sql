-- +goose Up
-- +goose StatementBegin

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at ASC);

-- Update get_chat_by_id to include messages
CREATE OR REPLACE FUNCTION get_chat_by_id(p_chat_id UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id', c.id,
    'title', c.title,
    'createdAt', c.created_at,
    'updatedAt', c.updated_at,
    'messages', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', m.id,
          'chatId', m.chat_id,
          'role', m.role,
          'content', m.content,
          'createdAt', m.created_at
        ) ORDER BY m.created_at ASC
      )
      FROM messages m WHERE m.chat_id = c.id
    ), '[]'::json)
  ) INTO result
  FROM chats c
  WHERE c.id = p_chat_id AND c.user_id = p_user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to send message and get AI response
CREATE OR REPLACE FUNCTION send_message_with_ai_response(
  p_chat_id UUID,
  p_user_id UUID,
  p_content TEXT
)
RETURNS JSON AS $$
DECLARE
  chat_exists BOOLEAN;
  user_message messages;
  ai_message messages;
  result JSON;
BEGIN
  -- Verify chat ownership
  SELECT EXISTS(
    SELECT 1 FROM chats
    WHERE id = p_chat_id AND user_id = p_user_id
  ) INTO chat_exists;

  IF NOT chat_exists THEN
    RETURN NULL;
  END IF;

  -- Insert user message
  INSERT INTO messages (chat_id, role, content)
  VALUES (p_chat_id, 'user', p_content)
  RETURNING * INTO user_message;

  -- Insert AI response (dummy for now)
  INSERT INTO messages (chat_id, role, content)
  VALUES (p_chat_id, 'assistant', 'This is a placeholder AI response. I received your message: "' || p_content || '"')
  RETURNING * INTO ai_message;

  -- Update chat's updated_at timestamp
  UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = p_chat_id;

  -- Build response JSON
  result := json_build_object(
    'userMessage', json_build_object(
      'id', user_message.id,
      'chatId', user_message.chat_id,
      'role', user_message.role,
      'content', user_message.content,
      'createdAt', user_message.created_at
    ),
    'assistantMessage', json_build_object(
      'id', ai_message.id,
      'chatId', ai_message.chat_id,
      'role', ai_message.role,
      'content', ai_message.content,
      'createdAt', ai_message.created_at
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP FUNCTION IF EXISTS send_message_with_ai_response(UUID, UUID, TEXT);

-- Restore original get_chat_by_id (without messages)
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
    'messages', '[]'::json
  ) INTO result
  FROM chats
  WHERE id = p_chat_id AND user_id = p_user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

DROP TABLE IF EXISTS messages;

-- +goose StatementEnd
