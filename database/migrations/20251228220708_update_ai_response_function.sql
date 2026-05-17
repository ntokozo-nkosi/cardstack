-- +goose Up
-- +goose StatementBegin

-- Drop old function
DROP FUNCTION IF EXISTS send_message_with_ai_response(UUID, UUID, TEXT);

-- Create updated function with AI response parameter
CREATE OR REPLACE FUNCTION send_message_with_ai_response(
  p_chat_id UUID,
  p_user_id UUID,
  p_content TEXT,
  p_ai_response TEXT
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

  -- Insert AI response (from parameter)
  INSERT INTO messages (chat_id, role, content)
  VALUES (p_chat_id, 'assistant', p_ai_response)
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

-- Drop updated function
DROP FUNCTION IF EXISTS send_message_with_ai_response(UUID, UUID, TEXT, TEXT);

-- Recreate old function with hardcoded response
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

  -- Insert AI response (dummy)
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
