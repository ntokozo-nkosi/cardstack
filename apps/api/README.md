# CardStack API

FastAPI backend for CardStack.

## Run locally

```sh
cd apps/api
uv run uvicorn src.main:app --reload --port 8080
```

From the repo root, you can also run:

```sh
make api-dev
```

## Endpoints

- `GET /` returns a hello-world response.
- `GET /health` returns a basic health check.
