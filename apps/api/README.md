# CardStack API

FastAPI backend for CardStack.

## Run locally

```sh
make api-dev
```

This uses the repo-root Docker Compose file and listens on port `8080`.

```sh
make stop
```

## Endpoints

- `GET /` returns a hello-world response.
- `GET /health` returns a basic health check.
