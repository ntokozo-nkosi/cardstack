-- +goose Up
-- +goose StatementBegin

-- get_collection_with_decks currently emits each nested deck with
-- _count: {cards: N} only. The new DeckSummary schema requires
-- _count: {cards, due}, so this CREATE OR REPLACE adds the `due` field
-- using the same predicate as list_user_decks.
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
        '_count', json_build_object(
          'cards', COALESCE((SELECT COUNT(*)::int FROM cards WHERE deck_id = d.id), 0),
          'due', COALESCE((
            SELECT COUNT(*)::int FROM cards
            WHERE deck_id = d.id
              AND (due_date IS NULL OR due_date <= CURRENT_TIMESTAMP)
          ), 0)
        )
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

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

-- Restore the prior body verbatim (verbatim from 20251216105758_funcs.sql).
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

-- +goose StatementEnd
