# CardStack API

FastAPI backend for CardStack.

## Run locally

```sh
make api-dev
```

This uses the repo-root Docker Compose file and listens on port `8080`.
Backend secrets are loaded from Doppler project `cardstack`, config `dev`.

```sh
make stop
```

## Database

Migrations live in the repo-root `database/migrations` directory and run against
Neon with `DATABASE_URL_UNPOOLED` from Doppler:

```sh
make db-status
make db-migrate
```

## Fly.io

The API has separate Fly apps in the `jnb` region:

- staging: `cardstack-app-api-staging`, configured by `apps/api/fly.staging.toml`
- production: `cardstack-app-api-prod`, configured by `apps/api/fly.production.toml`

Create the apps once:

```sh
fly apps create cardstack-app-api-staging --org personal
fly apps create cardstack-app-api-prod --org personal
```

Set the runtime Doppler token as the only Fly secret. Use a Doppler service
token scoped to the matching `cardstack` config:

```sh
fly secrets set DOPPLER_TOKEN=... --app cardstack-app-api-staging
fly secrets set DOPPLER_TOKEN=... --app cardstack-app-api-prod
```

That Doppler token must resolve:

- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `CLERK_JWT_KEY` when configured
- `CLERK_AUTHORIZED_PARTIES` when configured

Validate and deploy:

```sh
make fly-api-validate
make fly-api-deploy
```

Check the deployed app:

```sh
curl https://cardstack-app-api-staging.fly.dev/health
curl https://cardstack-app-api-prod.fly.dev/health
make fly-api-status
make fly-api-logs
make fly-api-secrets
```

## Endpoints

- `GET /` returns a hello-world response.
- `GET /health` returns a basic health check.
- `GET /v1/decks` returns the signed-in user's Neon-backed decks/cards and
  requires `Authorization: Bearer <clerk_session_token>`.
