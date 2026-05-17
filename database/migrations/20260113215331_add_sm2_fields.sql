-- +goose Up
-- +goose StatementBegin

-- Add SM-2 algorithm fields to cards table
ALTER TABLE cards ADD COLUMN repetitions INTEGER DEFAULT 0;
ALTER TABLE cards ADD COLUMN ease_factor NUMERIC(4,2) DEFAULT 2.50;
ALTER TABLE cards ADD COLUMN interval_days NUMERIC(10,2) DEFAULT 0;
ALTER TABLE cards ADD COLUMN due_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE cards ADD COLUMN is_new BOOLEAN DEFAULT TRUE;

-- Create indexes for efficient due date queries
CREATE INDEX idx_cards_due_date ON cards(due_date);
CREATE INDEX idx_cards_deck_due ON cards(deck_id, due_date);

-- Replace record_card_review with SM-2 implementation
DROP FUNCTION IF EXISTS record_card_review(UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION record_card_review_sm2(
  p_card_id UUID,
  p_user_id UUID,
  p_response TEXT
)
RETURNS JSON AS $$
DECLARE
  v_quality INTEGER;
  v_card RECORD;
  v_new_ef NUMERIC;
  v_new_interval NUMERIC;
  v_new_reps INTEGER;
  v_updated_count INTEGER;
BEGIN
  -- Map button response to SM-2 quality (0-5)
  -- Option B mapping: Again=0, Hard=2, Good=4, Easy=5
  v_quality := CASE p_response
    WHEN 'again' THEN 0
    WHEN 'hard' THEN 2
    WHEN 'good' THEN 4
    WHEN 'easy' THEN 5
    ELSE NULL
  END;

  IF v_quality IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid response');
  END IF;

  -- Get current card state with ownership check
  SELECT c.repetitions, c.ease_factor, c.interval_days, c.is_new
  INTO v_card
  FROM cards c
  JOIN decks d ON c.deck_id = d.id
  WHERE c.id = p_card_id AND d.user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Card not found or unauthorized');
  END IF;

  -- SM-2 Algorithm: Calculate new interval
  IF v_quality >= 3 THEN
    -- Correct response (quality >= 3)
    IF v_card.repetitions = 0 THEN
      v_new_interval := 1;  -- 1 day
    ELSIF v_card.repetitions = 1 THEN
      v_new_interval := 6;  -- 6 days
    ELSE
      v_new_interval := ROUND(v_card.interval_days * v_card.ease_factor, 2);
    END IF;
    v_new_reps := v_card.repetitions + 1;
  ELSIF v_quality = 0 THEN
    -- "Again" response: review in current session (1 minute)
    v_new_reps := 0;
    v_new_interval := 0.0007;  -- ~1 minute (1/1440 days)
  ELSE
    -- "Hard" response (quality = 2): review tomorrow
    v_new_reps := 0;
    v_new_interval := 1;  -- 1 day
  END IF;

  -- SM-2 Algorithm: Update Ease Factor
  -- Formula: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  v_new_ef := v_card.ease_factor + (0.1 - (5 - v_quality) * (0.08 + (5 - v_quality) * 0.02));

  -- Hard limit: EF cannot go below 1.3
  IF v_new_ef < 1.3 THEN
    v_new_ef := 1.3;
  END IF;

  -- Update card with new SM-2 values
  WITH updated AS (
    UPDATE cards
    SET
      last_response = p_response,
      last_reviewed_at = CURRENT_TIMESTAMP,
      review_count = review_count + 1,
      repetitions = v_new_reps,
      ease_factor = v_new_ef,
      interval_days = v_new_interval,
      due_date = CURRENT_TIMESTAMP + (v_new_interval || ' days')::INTERVAL,
      is_new = FALSE
    WHERE id = p_card_id
    RETURNING id
  )
  SELECT COUNT(*) INTO v_updated_count FROM updated;

  IF v_updated_count = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Update failed');
  END IF;

  -- Return success with calculated values for debugging/display
  RETURN json_build_object(
    'success', true,
    'interval', v_new_interval,
    'easeFactor', v_new_ef,
    'repetitions', v_new_reps,
    'dueDate', CURRENT_TIMESTAMP + (v_new_interval || ' days')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql;

-- Update get_deck_with_cards to include SM-2 fields
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
        'reviewCount', c.review_count,
        'repetitions', c.repetitions,
        'easeFactor', c.ease_factor,
        'intervalDays', c.interval_days,
        'dueDate', c.due_date,
        'isNew', c.is_new
      ) ORDER BY c.due_date ASC, c.created_at DESC)
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

-- Drop SM-2 function
DROP FUNCTION IF EXISTS record_card_review_sm2(UUID, UUID, TEXT);

-- Recreate original record_card_review function
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

-- Revert get_deck_with_cards to exclude SM-2 fields
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

-- Drop indexes
DROP INDEX IF EXISTS idx_cards_deck_due;
DROP INDEX IF EXISTS idx_cards_due_date;

-- Remove SM-2 columns
ALTER TABLE cards DROP COLUMN IF EXISTS is_new;
ALTER TABLE cards DROP COLUMN IF EXISTS due_date;
ALTER TABLE cards DROP COLUMN IF EXISTS interval_days;
ALTER TABLE cards DROP COLUMN IF EXISTS ease_factor;
ALTER TABLE cards DROP COLUMN IF EXISTS repetitions;

-- +goose StatementEnd
