DOPPLER_PROJECT ?= cardstack-ios
DOPPLER_CONFIG ?= dev
SECRETS_XCCONFIG := apps/ios/CardStackIOS/Config/Secrets.xcconfig
API_PORT ?= 8080

.PHONY: secrets api-dev
secrets:
	@mkdir -p apps/ios/CardStackIOS/Config
	@printf 'CLERK_PUBLISHABLE_KEY = %s\n' "$$(doppler secrets get CLERK_PUBLISHABLE_KEY --plain --project $(DOPPLER_PROJECT) --config $(DOPPLER_CONFIG))" > $(SECRETS_XCCONFIG)
	@echo "Wrote $(SECRETS_XCCONFIG)"

api-dev:
	@cd apps/api && uv run uvicorn src.main:app --reload --port $(API_PORT)
