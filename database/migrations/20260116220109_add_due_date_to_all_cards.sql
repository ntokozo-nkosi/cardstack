-- +goose Up
-- +goose StatementBegin

-- Update get_all_user_cards to include dueDate field
CREATE OR REPLACE FUNCTION get_all_user_cards(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(json_build_object(
    'id', c.id,
    'front', c.front,
    'back', c.back,
    'deckId', d.id,
    'deckName', d.name,
    'createdAt', c.created_at,
    'dueDate', c.due_date
  ) ORDER BY c.created_at DESC) INTO result
  FROM cards c
  INNER JOIN decks d ON c.deck_id = d.id
  WHERE d.user_id = p_user_id;

  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

-- Revert get_all_user_cards to exclude dueDate field
CREATE OR REPLACE FUNCTION get_all_user_cards(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(json_build_object(
    'id', c.id,
    'front', c.front,
    'back', c.back,
    'deckId', d.id,
    'deckName', d.name,
    'createdAt', c.created_at
  ) ORDER BY c.created_at DESC) INTO result
  FROM cards c
  INNER JOIN decks d ON c.deck_id = d.id
  WHERE d.user_id = p_user_id;

  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- +goose StatementEnd
