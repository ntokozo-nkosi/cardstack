-- +goose Up
-- +goose StatementBegin

-- Extend update_card_if_owned to support optional deck transfer
CREATE OR REPLACE FUNCTION update_card_if_owned(
  p_card_id UUID,
  p_user_id UUID,
  p_front TEXT,
  p_back TEXT,
  p_new_deck_id UUID DEFAULT NULL
)
RETURNS TABLE(id UUID, deck_id UUID, front TEXT, back TEXT, created_at TIMESTAMP) AS $$
BEGIN
  -- If no deck transfer requested, update only front/back (existing behavior)
  IF p_new_deck_id IS NULL THEN
    RETURN QUERY
    UPDATE cards c
    SET front = p_front, back = p_back
    FROM decks d
    WHERE c.id = p_card_id
      AND c.deck_id = d.id
      AND d.user_id = p_user_id
    RETURNING c.id, c.deck_id, c.front, c.back, c.created_at;
  ELSE
    -- Verify user owns both current deck and target deck, then update all fields
    RETURN QUERY
    UPDATE cards c
    SET front = p_front, back = p_back, deck_id = p_new_deck_id
    FROM decks d_current, decks d_target
    WHERE c.id = p_card_id
      AND c.deck_id = d_current.id
      AND d_current.user_id = p_user_id
      AND d_target.id = p_new_deck_id
      AND d_target.user_id = p_user_id
    RETURNING c.id, c.deck_id, c.front, c.back, c.created_at;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

-- Restore original function without deck transfer support
CREATE OR REPLACE FUNCTION update_card_if_owned(p_card_id UUID, p_user_id UUID, p_front TEXT, p_back TEXT)
RETURNS TABLE(id UUID, deck_id UUID, front TEXT, back TEXT, created_at TIMESTAMP) AS $$
BEGIN
  RETURN QUERY
  UPDATE cards c
  SET front = p_front, back = p_back
  FROM decks d
  WHERE c.id = p_card_id
    AND c.deck_id = d.id
    AND d.user_id = p_user_id
  RETURNING c.id, c.deck_id, c.front, c.back, c.created_at;
END;
$$ LANGUAGE plpgsql;

-- +goose StatementEnd
