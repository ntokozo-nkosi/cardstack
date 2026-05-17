-- +goose Up
-- +goose StatementBegin

CREATE OR REPLACE FUNCTION bulk_delete_cards_if_owned(p_card_ids UUID[], p_user_id UUID)
RETURNS INT AS $$
DECLARE
  deleted_count INT;
BEGIN
  WITH deleted AS (
    DELETE FROM cards c
    USING decks d
    WHERE c.id = ANY(p_card_ids)
      AND c.deck_id = d.id 
      AND d.user_id = p_user_id
    RETURNING c.id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP FUNCTION IF EXISTS bulk_delete_cards_if_owned(UUID[], UUID);
-- +goose StatementEnd
