.PHONY: dev build migration migrate rollback reset db-reset

# Development
dev:
	doppler run -- npm run dev

build:
	doppler run -- npm run build

# Database migrations (uses DATABASE_URL_UNPOOLED for direct connection to avoid pooler issues)
migration:
	doppler run -- sh -c 'GOOSE_DRIVER=postgres GOOSE_DBSTRING=$$DATABASE_URL_UNPOOLED goose -dir database/migrations create $(name) sql'

migrate:
	doppler run -- sh -c 'GOOSE_DRIVER=postgres GOOSE_DBSTRING=$$DATABASE_URL_UNPOOLED goose -dir database/migrations up'

rollback:
	doppler run -- sh -c 'GOOSE_DRIVER=postgres GOOSE_DBSTRING=$$DATABASE_URL_UNPOOLED goose -dir database/migrations down'

reset:
	doppler run -- sh -c 'GOOSE_DRIVER=postgres GOOSE_DBSTRING=$$DATABASE_URL_UNPOOLED goose -dir database/migrations reset'

hard-reset:
	doppler run -- sh -c 'psql "$$DATABASE_URL_UNPOOLED" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"'
