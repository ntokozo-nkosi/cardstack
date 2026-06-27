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

The production API app is configured in `apps/api/fly.toml` as
`cardstack-app-api` in the `jnb` region.

Create the app once:

```sh
fly apps create cardstack-app-api --org personal
```

Set the runtime Doppler token as the only Fly secret:

```sh
fly secrets set DOPPLER_TOKEN=... --app cardstack-app-api
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
curl https://cardstack-app-api.fly.dev/health
make fly-api-status
make fly-api-logs
make fly-api-secrets
```

## Endpoints

- `GET /` returns a hello-world response.
- `GET /health` returns a basic health check.
- `GET /v1/decks` returns the signed-in user's Neon-backed decks/cards and
  requires `Authorization: Bearer <clerk_session_token>`.
