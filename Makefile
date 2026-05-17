DOPPLER_PROJECT ?= cardstack-ios
DOPPLER_CONFIG ?= dev
SECRETS_XCCONFIG := CardStackIOS/Config/Secrets.xcconfig

.PHONY: secrets
secrets:
	@mkdir -p CardStackIOS/Config
	@printf 'CLERK_PUBLISHABLE_KEY = %s\n' "$$(doppler secrets get CLERK_PUBLISHABLE_KEY --plain --project $(DOPPLER_PROJECT) --config $(DOPPLER_CONFIG))" > $(SECRETS_XCCONFIG)
	@echo "Wrote $(SECRETS_XCCONFIG)"
