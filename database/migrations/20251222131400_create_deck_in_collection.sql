-- +goose Up
-- +goose StatementBegin
CREATE OR REPLACE FUNCTION create_deck_in_collection_if_owned(
  p_collection_id UUID,
  p_user_id UUID,
  p_deck_name TEXT,
  p_deck_description TEXT
)
RETURNS JSON AS $$
DECLARE
  v_deck_id UUID;
  v_collection_exists BOOLEAN;
  result JSON;
BEGIN
  -- Verify collection ownership
  SELECT EXISTS(
    SELECT 1 FROM collections
    WHERE id = p_collection_id AND user_id = p_user_id
  ) INTO v_collection_exists;

  IF NOT v_collection_exists THEN
    RAISE EXCEPTION 'Collection not found or access denied';
  END IF;

  -- Create deck
  INSERT INTO decks (name, description, user_id)
  VALUES (p_deck_name, p_deck_description, p_user_id)
  RETURNING id INTO v_deck_id;

  -- Associate with collection
  INSERT INTO collection_decks (collection_id, deck_id)
  VALUES (p_collection_id, v_deck_id);

  -- Return created deck as JSON
  SELECT json_build_object(
    'id', d.id,
    'name', d.name,
    'description', d.description,
    'createdAt', d.created_at
  ) INTO result
  FROM decks d
  WHERE d.id = v_deck_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP FUNCTION IF EXISTS create_deck_in_collection_if_owned(UUID, UUID, TEXT, TEXT);
-- +goose StatementEnd
