# CardStack

Simple monorepo for CardStack clients and backend services.

## Layout

```text
apps/
  api/    FastAPI backend
  web/    placeholder for a future web client
  ios/    iOS app and Xcode project
infra/    infrastructure code
scripts/  repo automation scripts
```

## Run the API

```sh
cd apps/api
uv run uvicorn src.main:app --reload --port 8080
```

Or from the repo root:

```sh
make api-dev
```

## iOS config

Generate the ignored iOS public config from Doppler:

```sh
make secrets
```

The iOS project now lives at:

```text
apps/ios/CardStackIOS.xcodeproj
```
