-- +goose Up
-- +goose StatementBegin

CREATE OR REPLACE FUNCTION bulk_create_cards(p_deck_id UUID, p_user_id UUID, p_cards JSON)
RETURNS TABLE(id UUID, deck_id UUID, front TEXT, back TEXT, created_at TIMESTAMP) AS $$
DECLARE
  v_deck_exists BOOLEAN;
BEGIN
  -- Verify deck ownership
  SELECT EXISTS(
    SELECT 1 FROM decks d 
    WHERE d.id = p_deck_id AND d.user_id = p_user_id
  ) INTO v_deck_exists;
  
  IF NOT v_deck_exists THEN
    RAISE EXCEPTION 'Deck not found or access denied';
  END IF;

  RETURN QUERY
  INSERT INTO cards (deck_id, front, back)
  SELECT 
    p_deck_id,
    x->>'front',
    x->>'back'
  FROM json_array_elements(p_cards) AS x
  RETURNING cards.id, cards.deck_id, cards.front, cards.back, cards.created_at;
END;
$$ LANGUAGE plpgsql;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP FUNCTION IF EXISTS bulk_create_cards(UUID, UUID, JSON);
-- +goose StatementEnd
