-- +goose Up
-- +goose StatementBegin

-- User management
CREATE OR REPLACE FUNCTION get_or_create_user(p_clerk_id TEXT, p_email TEXT)
RETURNS TABLE(user_id UUID, user_clerk_id TEXT, user_email TEXT, user_created_at TIMESTAMP) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO users (clerk_id, email)
  VALUES (p_clerk_id, p_email)
  ON CONFLICT (clerk_id) DO UPDATE SET email = EXCLUDED.email
  RETURNING users.id, users.clerk_id, users.email, users.created_at;
END;
$$ LANGUAGE plpgsql;

-- Get deck with cards in single call (returns JSON)
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

-- Get collection with decks in single call (returns JSON)
CREATE OR REPLACE FUNCTION get_collection_with_decks(p_collection_id UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id', col.id,
    'name', col.name,
    'description', col.description,
    'createdAt', col.created_at,
    'decks', COALESCE((
      SELECT json_agg(json_build_object(
        'id', d.id,
        'name', d.name,
        'description', d.description,
        'createdAt', d.created_at,
        '_count', json_build_object('cards', (SELECT COUNT(*) FROM cards WHERE deck_id = d.id)::int)
      ) ORDER BY cd.added_at DESC)
      FROM decks d
      JOIN collection_decks cd ON cd.deck_id = d.id
      WHERE cd.collection_id = col.id
    ), '[]'::json)
  ) INTO result
  FROM collections col
  WHERE col.id = p_collection_id AND col.user_id = p_user_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update card with ownership check (returns updated card or NULL)
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

-- Delete card with ownership check (returns TRUE if deleted)
CREATE OR REPLACE FUNCTION delete_card_if_owned(p_card_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  deleted_count INT;
BEGIN
  WITH deleted AS (
    DELETE FROM cards c
    USING decks d
    WHERE c.id = p_card_id 
      AND c.deck_id = d.id 
      AND d.user_id = p_user_id
    RETURNING c.id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Add deck to collection with ownership checks (returns success status)
CREATE OR REPLACE FUNCTION add_deck_to_collection_if_owned(p_collection_id UUID, p_deck_id UUID, p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  collection_exists BOOLEAN;
  deck_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM collections WHERE id = p_collection_id AND user_id = p_user_id) INTO collection_exists;
  IF NOT collection_exists THEN
    RETURN 'COLLECTION_NOT_FOUND';
  END IF;
  
  SELECT EXISTS(SELECT 1 FROM decks WHERE id = p_deck_id AND user_id = p_user_id) INTO deck_exists;
  IF NOT deck_exists THEN
    RETURN 'DECK_NOT_FOUND';
  END IF;
  
  INSERT INTO collection_decks (collection_id, deck_id)
  VALUES (p_collection_id, p_deck_id)
  ON CONFLICT (collection_id, deck_id) DO NOTHING;
  
  RETURN 'SUCCESS';
END;
$$ LANGUAGE plpgsql;

-- Remove deck from collection with ownership check
CREATE OR REPLACE FUNCTION remove_deck_from_collection_if_owned(p_collection_id UUID, p_deck_id UUID, p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  collection_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM collections WHERE id = p_collection_id AND user_id = p_user_id) INTO collection_exists;
  IF NOT collection_exists THEN
    RETURN 'COLLECTION_NOT_FOUND';
  END IF;
  
  DELETE FROM collection_decks WHERE collection_id = p_collection_id AND deck_id = p_deck_id;
  
  RETURN 'SUCCESS';
END;
$$ LANGUAGE plpgsql;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP FUNCTION IF EXISTS remove_deck_from_collection_if_owned(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS add_deck_to_collection_if_owned(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS delete_card_if_owned(UUID, UUID);
DROP FUNCTION IF EXISTS update_card_if_owned(UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_collection_with_decks(UUID, UUID);
DROP FUNCTION IF EXISTS get_deck_with_cards(UUID, UUID);
DROP FUNCTION IF EXISTS get_or_create_user(TEXT, TEXT);
-- +goose StatementEnd
