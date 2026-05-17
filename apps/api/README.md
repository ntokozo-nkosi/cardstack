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

## Endpoints

- `GET /` returns a hello-world response.
- `GET /health` returns a basic health check.
- `GET /v1/decks` returns the signed-in user's Neon-backed decks/cards and
  requires `Authorization: Bearer <clerk_session_token>`.
