from fastapi import FastAPI

app = FastAPI(title="CardStack API")


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Hello from CardStack API"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
