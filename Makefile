DOPPLER_PROJECT ?= cardstack-ios
DOPPLER_CONFIG ?= dev
API_DOPPLER_PROJECT ?= cardstack
API_DOPPLER_CONFIG ?= dev
WEB_DOPPLER_PROJECT ?= cardstack
WEB_DOPPLER_CONFIG ?= dev
SECRETS_XCCONFIG := apps/ios/CardStackIOS/Config/Secrets.xcconfig
API_PORT ?= 8080
API_IMAGE ?= cardstack-api
IOS_PROJECT := apps/ios/CardStackIOS.xcodeproj
IOS_SCHEME ?= CardStackIOS
IOS_CONFIGURATION ?= Debug
IOS_SIMULATOR ?= iPhone 17 Pro
IOS_BUNDLE_ID ?= ntokozo.CardStackIOS
IOS_LOG_PROCESS ?= CardStackIOS
BUN := bun

.PHONY: secrets api-dev logs-api stop migration db-migrate db-status db-rollback ios-build ios-run logs-ios check-bun web-install web-dev web-build web-start web-lint
secrets:
	@mkdir -p apps/ios/CardStackIOS/Config
	@printf 'CLERK_PUBLISHABLE_KEY = %s\n' "$$(doppler secrets get CLERK_PUBLISHABLE_KEY --plain --project $(DOPPLER_PROJECT) --config $(DOPPLER_CONFIG))" > $(SECRETS_XCCONFIG)
	@printf 'API_BASE_URL = %s\n' "$$(doppler secrets get API_BASE_URL --plain --project $(DOPPLER_PROJECT) --config $(DOPPLER_CONFIG) | sed 's|//|/$$()/|')" >> $(SECRETS_XCCONFIG)
	@echo "Wrote $(SECRETS_XCCONFIG)"

api-dev:
	@API_IMAGE=$(API_IMAGE) API_PORT=$(API_PORT) doppler run --project $(API_DOPPLER_PROJECT) --config $(API_DOPPLER_CONFIG) -- docker compose up --build -d api

logs-api:
	@docker compose logs -f api

stop:
	@docker compose down

migration:
	@test -n "$(NAME)" || (echo "Usage: make migration NAME=add_example" && exit 1)
	@goose -dir database/migrations create $(NAME) sql

db-migrate:
	@doppler run --project $(API_DOPPLER_PROJECT) --config $(API_DOPPLER_CONFIG) -- sh -c 'GOOSE_DRIVER=postgres GOOSE_DBSTRING="$$DATABASE_URL_UNPOOLED" goose -dir database/migrations up'

db-status:
	@doppler run --project $(API_DOPPLER_PROJECT) --config $(API_DOPPLER_CONFIG) -- sh -c 'GOOSE_DRIVER=postgres GOOSE_DBSTRING="$$DATABASE_URL_UNPOOLED" goose -dir database/migrations status'

db-rollback:
	@doppler run --project $(API_DOPPLER_PROJECT) --config $(API_DOPPLER_CONFIG) -- sh -c 'GOOSE_DRIVER=postgres GOOSE_DBSTRING="$$DATABASE_URL_UNPOOLED" goose -dir database/migrations down'

ios-build:
	@xcodebuild \
		-project $(IOS_PROJECT) \
		-scheme $(IOS_SCHEME) \
		-configuration $(IOS_CONFIGURATION) \
		-destination 'platform=iOS Simulator,name=$(IOS_SIMULATOR)' \
		build

ios-run:
	@xcodebuild \
		-project $(IOS_PROJECT) \
		-scheme $(IOS_SCHEME) \
		-configuration $(IOS_CONFIGURATION) \
		-destination 'platform=iOS Simulator,name=$(IOS_SIMULATOR)' \
		build
	@DEVICE_ID="$$(xcrun simctl list devices available | awk -F '[()]' -v name="$(IOS_SIMULATOR)" '$$0 ~ name { print $$2; exit }')"; \
	xcrun simctl boot "$$DEVICE_ID" 2>/dev/null || true; \
	xcrun simctl bootstatus "$$DEVICE_ID" -b; \
	open -a Simulator
	@APP_PATH="$$(xcodebuild \
		-project $(IOS_PROJECT) \
		-scheme $(IOS_SCHEME) \
		-configuration $(IOS_CONFIGURATION) \
		-destination 'platform=iOS Simulator,name=$(IOS_SIMULATOR)' \
		-showBuildSettings \
		| awk -F ' = ' '/TARGET_BUILD_DIR/ { target=$$2 } /FULL_PRODUCT_NAME/ { product=$$2 } END { print target "/" product }')"; \
	DEVICE_ID="$$(xcrun simctl list devices available | awk -F '[()]' -v name="$(IOS_SIMULATOR)" '$$0 ~ name { print $$2; exit }')"; \
	xcrun simctl install "$$DEVICE_ID" "$$APP_PATH"; \
	xcrun simctl launch "$$DEVICE_ID" $(IOS_BUNDLE_ID)

logs-ios:
	@xcrun simctl spawn booted log stream \
		--style compact \
		--level debug \
		--predicate 'process == "$(IOS_LOG_PROCESS)"'

check-bun:
	@command -v $(BUN) >/dev/null 2>&1 || { echo "Bun is required. Install it from https://bun.sh"; exit 1; }

web-install: check-bun
	@cd apps/web && $(BUN) install

web-dev: check-bun
	@cd apps/web && doppler run --project $(WEB_DOPPLER_PROJECT) --config $(WEB_DOPPLER_CONFIG) -- $(BUN) run dev

web-build: check-bun
	@cd apps/web && doppler run --project $(WEB_DOPPLER_PROJECT) --config $(WEB_DOPPLER_CONFIG) -- $(BUN) run build

web-start: check-bun
	@cd apps/web && doppler run --project $(WEB_DOPPLER_PROJECT) --config $(WEB_DOPPLER_CONFIG) -- $(BUN) run start

web-lint: check-bun
	@cd apps/web && $(BUN) run lint
