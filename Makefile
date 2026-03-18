.DEFAULT_GOAL := dev

DOPPLER_RUN := doppler run --
GOOSE_CMD := GOOSE_DRIVER=postgres GOOSE_DBSTRING=$$DATABASE_URL_UNPOOLED goose -dir database/migrations

.PHONY: check-doppler dev build start lint migration migrate rollback reset hard-reset

check-doppler:
	@command -v doppler >/dev/null 2>&1 || { echo "Doppler CLI is required. Install it from https://docs.doppler.com/docs/cli"; exit 1; }

# Application
dev: check-doppler
	$(DOPPLER_RUN) npm run dev

build: check-doppler
	$(DOPPLER_RUN) npm run build

start: check-doppler
	$(DOPPLER_RUN) npm run start

lint: check-doppler
	$(DOPPLER_RUN) npm run lint

# Database migrations (uses DATABASE_URL_UNPOOLED for direct connection to avoid pooler issues)
migration: check-doppler
ifndef name
	$(error usage: make migration name=your_migration_name)
endif
	$(DOPPLER_RUN) sh -c '$(GOOSE_CMD) create $(name) sql'

migrate: check-doppler
	$(DOPPLER_RUN) sh -c '$(GOOSE_CMD) up'

rollback: check-doppler
	$(DOPPLER_RUN) sh -c '$(GOOSE_CMD) down'

reset: check-doppler
	$(DOPPLER_RUN) sh -c '$(GOOSE_CMD) reset'

hard-reset: check-doppler
	$(DOPPLER_RUN) sh -c 'psql "$$DATABASE_URL_UNPOOLED" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"'
