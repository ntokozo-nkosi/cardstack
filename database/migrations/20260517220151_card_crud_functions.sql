-- +goose Up
-- +goose StatementBegin

-- Create a single card in a deck, verifying deck ownership.
-- Returns the new card as JSON in the same shape used by get_deck_with_cards,
-- or NULL if the deck is not owned by the user.
CREATE OR REPLACE FUNCTION create_card_if_owned(
  p_deck_id UUID,
  p_user_id UUID,
  p_front TEXT,
  p_back TEXT
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH inserted AS (
    INSERT INTO cards (deck_id, front, back)
    SELECT p_deck_id, p_front, p_back
    FROM decks
    WHERE id = p_deck_id AND user_id = p_user_id
    RETURNING id, deck_id, front, back, created_at,
              last_response, last_reviewed_at, review_count,
              repetitions, ease_factor, interval_days, due_date, is_new
  )
  SELECT json_build_object(
    'id', i.id,
    'deckId', i.deck_id,
    'front', i.front,
    'back', i.back,
    'createdAt', i.created_at,
    'lastResponse', i.last_response,
    'lastReviewedAt', i.last_reviewed_at,
    'reviewCount', i.review_count,
    'repetitions', i.repetitions,
    'easeFactor', i.ease_factor,
    'intervalDays', i.interval_days,
    'dueDate', i.due_date,
    'isNew', i.is_new
  ) INTO result
  FROM inserted i;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP FUNCTION IF EXISTS create_card_if_owned(UUID, UUID, TEXT, TEXT);

-- +goose StatementEnd
