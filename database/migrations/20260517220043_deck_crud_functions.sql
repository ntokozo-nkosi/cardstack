-- +goose Up
-- +goose StatementBegin

-- Create a deck for the given user; returns the new deck as JSON in summary shape.
CREATE OR REPLACE FUNCTION create_deck(p_user_id UUID, p_name TEXT, p_description TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH inserted AS (
    INSERT INTO decks (name, description, user_id)
    VALUES (p_name, p_description, p_user_id)
    RETURNING id, name, description, created_at
  )
  SELECT json_build_object(
    'id', i.id,
    'name', i.name,
    'description', i.description,
    'createdAt', i.created_at,
    '_count', json_build_object('cards', 0, 'due', 0)
  ) INTO result
  FROM inserted i;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update a deck's name/description if owned. Returns the updated deck as JSON, or NULL if not owned.
CREATE OR REPLACE FUNCTION update_deck_if_owned(p_deck_id UUID, p_user_id UUID, p_name TEXT, p_description TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH updated AS (
    UPDATE decks
    SET name = p_name, description = p_description
    WHERE id = p_deck_id AND user_id = p_user_id
    RETURNING id, name, description, created_at
  )
  SELECT json_build_object(
    'id', u.id,
    'name', u.name,
    'description', u.description,
    'createdAt', u.created_at,
    '_count', json_build_object(
      'cards', (SELECT COUNT(*)::int FROM cards WHERE deck_id = u.id),
      'due', (SELECT COUNT(*)::int FROM cards WHERE deck_id = u.id AND (due_date IS NULL OR due_date <= CURRENT_TIMESTAMP))
    )
  ) INTO result
  FROM updated u;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Delete a deck if owned. Cascading FKs handle cards and collection_decks rows.
CREATE OR REPLACE FUNCTION delete_deck_if_owned(p_deck_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  deleted_count INT;
BEGIN
  WITH deleted AS (
    DELETE FROM decks
    WHERE id = p_deck_id AND user_id = p_user_id
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Replace list_user_decks with a version that includes _count {cards, due}.
CREATE OR REPLACE FUNCTION list_user_decks(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'id', d.id,
        'name', d.name,
        'description', d.description,
        'createdAt', d.created_at,
        '_count', json_build_object(
          'cards', COALESCE(card_counts.total, 0),
          'due', COALESCE(card_counts.due, 0)
        )
      )
      ORDER BY d.created_at DESC
    ),
    '[]'::json
  )
  INTO result
  FROM decks d
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE c.due_date IS NULL OR c.due_date <= CURRENT_TIMESTAMP)::int AS due
    FROM cards c
    WHERE c.deck_id = d.id
  ) card_counts ON TRUE
  WHERE d.user_id = p_user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP FUNCTION IF EXISTS create_deck(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS update_deck_if_owned(UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS delete_deck_if_owned(UUID, UUID);

-- Restore the prior list_user_decks (verbatim from 20260517213212_list_user_decks.sql).
CREATE OR REPLACE FUNCTION list_user_decks(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'id', d.id,
        'name', d.name,
        'description', d.description,
        'createdAt', d.created_at
      )
      ORDER BY d.created_at DESC
    ),
    '[]'::json
  )
  INTO result
  FROM decks d
  WHERE d.user_id = p_user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- +goose StatementEnd
