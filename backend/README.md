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

## Deploy (Render + Supabase)

- Dockerfile included (`backend/` as root)
- Set `DATABASE_URL`, `FEATURE_FLAGS_API_KEY`, `CORS_ORIGINS`
- `postgres://` URLs are auto-normalized to `postgresql+psycopg://`

### Important: IPv4 / pooler

Render often cannot open outbound IPv6. Supabase **direct** hosts (`db.<ref>.supabase.co:5432`) may resolve to IPv6 and crash startup with `Network is unreachable`.

Use the **Session pooler** connection string from Supabase Dashboard → Database → Connect:

```env
DATABASE_URL=postgresql+psycopg://postgres.YOUR_REF:PASSWORD@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require
```

Avoid the direct `db.*.supabase.co` URI on Render unless you enabled the Supabase IPv4 add-on.
