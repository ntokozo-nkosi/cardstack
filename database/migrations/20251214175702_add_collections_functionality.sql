-- +goose Up
-- +goose StatementBegin
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE collection_decks (
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collection_id, deck_id)
);

CREATE INDEX idx_collection_decks_collection_id ON collection_decks(collection_id);
CREATE INDEX idx_collection_decks_deck_id ON collection_decks(deck_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS collection_decks;
DROP TABLE IF EXISTS collections;
-- +goose StatementEnd
