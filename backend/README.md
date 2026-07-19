# Pulse Flag API (FastAPI)

## Delivery contract

```http
GET /evaluate?key=ai.canvas_generator&tenant_id=<uuid>
Authorization: Bearer <PROJECT_OR_PLATFORM_API_KEY>
```

```json
{ "enabled": true }
```

Optional: `&tier=pro`

## Run locally

```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8002
```

Healthcheck: `GET /health`

## Deploy (Railway)

- Dockerfile + `railway.toml` included
- Set `DATABASE_URL`, `FEATURE_FLAGS_API_KEY`, `CORS_ORIGINS`
- `postgres://` URLs are auto-normalized to `postgresql+psycopg://`
