-- +goose Up
-- +goose StatementBegin

-- Add review tracking fields to cards table
ALTER TABLE cards ADD COLUMN last_response TEXT;
ALTER TABLE cards ADD COLUMN last_reviewed_at TIMESTAMP;
ALTER TABLE cards ADD COLUMN review_count INTEGER DEFAULT 0;

-- Create function to record card review with ownership check
CREATE OR REPLACE FUNCTION record_card_review(p_card_id UUID, p_user_id UUID, p_response TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  updated_count INT;
BEGIN
  WITH updated AS (
    UPDATE cards c
    SET
      last_response = p_response,
      last_reviewed_at = CURRENT_TIMESTAMP,
      review_count = COALESCE(review_count, 0) + 1
    FROM decks d
    WHERE c.id = p_card_id
      AND c.deck_id = d.id
      AND d.user_id = p_user_id
    RETURNING c.id
  )
  SELECT COUNT(*) INTO updated_count FROM updated;

  RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Update get_deck_with_cards to include review tracking fields
CREATE OR REPLACE FUNCTION get_deck_with_cards(p_deck_id UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id', d.id,
    'name', d.name,
    'description', d.description,
    'createdAt', d.created_at,
    'cards', COALESCE((
      SELECT json_agg(json_build_object(
        'id', c.id,
        'deckId', c.deck_id,
        'front', c.front,
        'back', c.back,
        'createdAt', c.created_at,
        'lastResponse', c.last_response,
        'lastReviewedAt', c.last_reviewed_at,
        'reviewCount', c.review_count
      ) ORDER BY c.created_at DESC)
      FROM cards c WHERE c.deck_id = d.id
    ), '[]'::json)
  ) INTO result
  FROM decks d
  WHERE d.id = p_deck_id AND d.user_id = p_user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

-- Revert get_deck_with_cards to original version
CREATE OR REPLACE FUNCTION get_deck_with_cards(p_deck_id UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id', d.id,
    'name', d.name,
    'description', d.description,
    'createdAt', d.created_at,
    'cards', COALESCE((
      SELECT json_agg(json_build_object(
        'id', c.id,
        'deckId', c.deck_id,
        'front', c.front,
        'back', c.back,
        'createdAt', c.created_at
      ) ORDER BY c.created_at DESC)
      FROM cards c WHERE c.deck_id = d.id
    ), '[]'::json)
  ) INTO result
  FROM decks d
  WHERE d.id = p_deck_id AND d.user_id = p_user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Drop the review function
DROP FUNCTION IF EXISTS record_card_review(UUID, UUID, TEXT);

-- Remove tracking columns from cards table
ALTER TABLE cards DROP COLUMN IF EXISTS review_count;
ALTER TABLE cards DROP COLUMN IF EXISTS last_reviewed_at;
ALTER TABLE cards DROP COLUMN IF EXISTS last_response;

-- +goose StatementEnd
