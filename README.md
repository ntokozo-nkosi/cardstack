# CardStack

Simple monorepo for CardStack clients and backend services.

## Layout

```text
apps/
  api/    FastAPI backend
  web/    Next.js (App Router) web client
  ios/    iOS app and Xcode project
infra/    infrastructure code
scripts/  repo automation scripts
```

## Run the API

```sh
make api-dev
```

This uses Docker Compose from [compose.yaml](/Users/ntokozo-nkosi/pro_space/other_projects/CardStackIOS/compose.yaml).

To stop it:

```sh
make stop
```

## Run the web app

Install deps (first time only):

```sh
make web-install
```

Start the dev server:

```sh
make web-dev
```

Build for production:

```sh
make web-build
make web-start
```

## iOS config

Generate the ignored iOS public config from Doppler:

```sh
make secrets
```

## Build and Run iOS

```sh
make ios-build
make ios-run
make ios-logs
```

The default simulator is `iPhone 17 Pro`. Override it when needed:

```sh
make ios-run IOS_SIMULATOR="iPhone 16"
```

The iOS project now lives at:

```text
apps/ios/CardStackIOS.xcodeproj
```
