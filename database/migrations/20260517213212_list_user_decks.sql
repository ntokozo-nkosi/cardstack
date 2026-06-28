-- +goose Up
-- +goose StatementBegin
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

-- +goose Down
-- +goose StatementBegin
DROP FUNCTION IF EXISTS list_user_decks(UUID);
-- +goose StatementEnd
