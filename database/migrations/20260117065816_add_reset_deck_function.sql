-- +goose Up
-- +goose StatementBegin

-- Reset all cards in a deck to initial SM-2 state
CREATE OR REPLACE FUNCTION reset_deck_cards(p_deck_id UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_reset_count INTEGER;
BEGIN
  -- Verify ownership and reset cards
  WITH updated AS (
    UPDATE cards c
    SET
      repetitions = 0,
      ease_factor = 2.50,
      interval_days = 0,
      due_date = CURRENT_TIMESTAMP,
      is_new = TRUE,
      last_response = NULL,
      last_reviewed_at = NULL,
      review_count = 0
    FROM decks d
    WHERE c.deck_id = d.id
      AND d.id = p_deck_id
      AND d.user_id = p_user_id
    RETURNING c.id
  )
  SELECT COUNT(*) INTO v_reset_count FROM updated;

  IF v_reset_count = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Deck not found or unauthorized');
  END IF;

  RETURN json_build_object('success', true, 'resetCount', v_reset_count);
END;
$$ LANGUAGE plpgsql;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP FUNCTION IF EXISTS reset_deck_cards(UUID, UUID);

-- +goose StatementEnd
