-- +goose Up
-- +goose StatementBegin

-- List all collections owned by the user with deck counts.
CREATE OR REPLACE FUNCTION list_user_collections(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'id', col.id,
        'name', col.name,
        'description', col.description,
        'createdAt', col.created_at,
        '_count', json_build_object(
          'decks', COALESCE((SELECT COUNT(*)::int FROM collection_decks WHERE collection_id = col.id), 0)
        )
      )
      ORDER BY col.created_at DESC
    ),
    '[]'::json
  )
  INTO result
  FROM collections col
  WHERE col.user_id = p_user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a collection for the given user; returns the new collection as JSON.
CREATE OR REPLACE FUNCTION create_collection(p_user_id UUID, p_name TEXT, p_description TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH inserted AS (
    INSERT INTO collections (name, description, user_id)
    VALUES (p_name, p_description, p_user_id)
    RETURNING id, name, description, created_at
  )
  SELECT json_build_object(
    'id', i.id,
    'name', i.name,
    'description', i.description,
    'createdAt', i.created_at,
    '_count', json_build_object('decks', 0)
  ) INTO result
  FROM inserted i;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update a collection's name/description if owned. Returns updated row as JSON, or NULL.
CREATE OR REPLACE FUNCTION update_collection_if_owned(
  p_collection_id UUID,
  p_user_id UUID,
  p_name TEXT,
  p_description TEXT
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH updated AS (
    UPDATE collections
    SET name = p_name, description = p_description
    WHERE id = p_collection_id AND user_id = p_user_id
    RETURNING id, name, description, created_at
  )
  SELECT json_build_object(
    'id', u.id,
    'name', u.name,
    'description', u.description,
    'createdAt', u.created_at,
    '_count', json_build_object(
      'decks', COALESCE((SELECT COUNT(*)::int FROM collection_decks WHERE collection_id = u.id), 0)
    )
  ) INTO result
  FROM updated u;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Delete a collection if owned. The collection_decks rows cascade via ON DELETE CASCADE on
-- collection_id, which unassigns decks without touching the decks or cards tables.
CREATE OR REPLACE FUNCTION delete_collection_if_owned(p_collection_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  deleted_count INT;
BEGIN
  WITH deleted AS (
    DELETE FROM collections
    WHERE id = p_collection_id AND user_id = p_user_id
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP FUNCTION IF EXISTS list_user_collections(UUID);
DROP FUNCTION IF EXISTS create_collection(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS update_collection_if_owned(UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS delete_collection_if_owned(UUID, UUID);

-- +goose StatementEnd
