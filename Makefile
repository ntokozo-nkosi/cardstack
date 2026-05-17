DOPPLER_PROJECT ?= cardstack-ios
DOPPLER_CONFIG ?= dev
SECRETS_XCCONFIG := apps/ios/CardStackIOS/Config/Secrets.xcconfig
API_PORT ?= 8080
API_IMAGE ?= cardstack-api
IOS_PROJECT := apps/ios/CardStackIOS.xcodeproj
IOS_SCHEME ?= CardStackIOS
IOS_CONFIGURATION ?= Debug
IOS_SIMULATOR ?= iPhone 17 Pro
IOS_BUNDLE_ID ?= ntokozo.CardStackIOS
IOS_LOG_PROCESS ?= CardStackIOS

.PHONY: secrets api-dev stop ios-build ios-run ios-logs
secrets:
	@mkdir -p apps/ios/CardStackIOS/Config
	@printf 'CLERK_PUBLISHABLE_KEY = %s\n' "$$(doppler secrets get CLERK_PUBLISHABLE_KEY --plain --project $(DOPPLER_PROJECT) --config $(DOPPLER_CONFIG))" > $(SECRETS_XCCONFIG)
	@echo "Wrote $(SECRETS_XCCONFIG)"

api-dev:
	@API_IMAGE=$(API_IMAGE) API_PORT=$(API_PORT) docker compose up --build api

stop:
	@docker compose down

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

ios-logs:
	@xcrun simctl spawn booted log stream \
		--style compact \
		--level debug \
		--predicate 'process == "$(IOS_LOG_PROCESS)"'
