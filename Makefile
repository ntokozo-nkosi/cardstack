.DEFAULT_GOAL := dev

BUN := bun
DOPPLER_RUN := doppler run --
GOOSE_CMD := GOOSE_DRIVER=postgres GOOSE_DBSTRING=$$DATABASE_URL_UNPOOLED goose -dir database/migrations
API_DOPPLER_PROJECT ?= cardstack
API_DOPPLER_CONFIG ?= dev
FLY_API_STAGING_APP ?= cardstack-app-api-staging
FLY_API_PRODUCTION_APP ?= cardstack-app-api-prod
IOS_PROJECT := apps/ios/CardStackIOS.xcodeproj
IOS_SCHEME ?= CardStackIOS
IOS_CONFIGURATION ?= Debug
IOS_SIMULATOR ?= iPhone 17 Pro
IOS_BUNDLE_ID ?= ntokozo.CardStackIOS
IOS_LOG_PROCESS ?= CardStackIOS

define fly_api_env
	@set -eu; \
	printf 'Select Fly API environment:\n  1) staging\n  2) production\nEnvironment: '; \
	read environment; \
	case "$$environment" in \
		1|staging) app="$(FLY_API_STAGING_APP)"; config="fly.staging.toml" ;; \
		2|production) app="$(FLY_API_PRODUCTION_APP)"; config="fly.production.toml" ;; \
		*) echo "Environment must be staging or production"; exit 1 ;; \
	esac; \
	$(1)
endef

.PHONY: check-bun check-doppler dev build start lint migration migrate rollback reset hard-reset api-dev stop-api logs-api fly-api-validate fly-api-deploy fly-api-status fly-api-logs fly-api-secrets ios-build ios-run logs-ios

check-bun:
	@command -v $(BUN) >/dev/null 2>&1 || { echo "Bun is required. Install it from https://bun.sh"; exit 1; }

check-doppler:
	@command -v doppler >/dev/null 2>&1 || { echo "Doppler CLI is required. Install it from https://docs.doppler.com/docs/cli"; exit 1; }

# Application
dev: check-bun check-doppler
	$(DOPPLER_RUN) $(BUN) run dev

build: check-bun check-doppler
	$(DOPPLER_RUN) $(BUN) run build

start: check-bun check-doppler
	$(DOPPLER_RUN) $(BUN) run start

lint: check-bun
	$(BUN) run lint

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

# FastAPI service
api-dev: check-doppler
	API_IMAGE=cardstack-api API_PORT=8080 doppler run --project $(API_DOPPLER_PROJECT) --config $(API_DOPPLER_CONFIG) -- docker compose up --build -d api

stop-api:
	docker compose down

logs-api:
	docker compose logs -f api

fly-api-validate:
	$(call fly_api_env,cd apps/api && fly config validate --config "$$config")

fly-api-deploy:
	$(call fly_api_env,cd apps/api && fly deploy --config "$$config" --app "$$app")

fly-api-status:
	$(call fly_api_env,fly status --app "$$app")

fly-api-logs:
	$(call fly_api_env,fly logs --app "$$app")

fly-api-secrets:
	$(call fly_api_env,fly secrets list --app "$$app")

# iOS app
ios-build:
	xcodebuild \
		-project $(IOS_PROJECT) \
		-scheme $(IOS_SCHEME) \
		-configuration $(IOS_CONFIGURATION) \
		-destination 'platform=iOS Simulator,name=$(IOS_SIMULATOR)' \
		build

ios-run: ios-build
	@DEVICE_ID="$$(xcrun simctl list devices available | awk -F '[()]' -v name="$(IOS_SIMULATOR)" '$$0 ~ name { print $$2; exit }')"; \
	xcrun simctl boot "$$DEVICE_ID" 2>/dev/null || true; \
	xcrun simctl bootstatus "$$DEVICE_ID" -b; \
	open -a Simulator; \
	APP_PATH="$$(xcodebuild \
		-project $(IOS_PROJECT) \
		-scheme $(IOS_SCHEME) \
		-configuration $(IOS_CONFIGURATION) \
		-destination 'platform=iOS Simulator,name=$(IOS_SIMULATOR)' \
		-showBuildSettings \
		| awk -F ' = ' '/TARGET_BUILD_DIR/ { target=$$2 } /FULL_PRODUCT_NAME/ { product=$$2 } END { print target "/" product }')"; \
	xcrun simctl install "$$DEVICE_ID" "$$APP_PATH"; \
	xcrun simctl launch "$$DEVICE_ID" $(IOS_BUNDLE_ID)

logs-ios:
	xcrun simctl spawn booted log stream \
		--style compact \
		--level debug \
		--predicate 'process == "$(IOS_LOG_PROCESS)"'
