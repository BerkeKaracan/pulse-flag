# Pulse Flag API

FastAPI service for feature-flag **delivery** (`GET /evaluate`) and **admin** CRUD (`/admin/*`).

## Delivery contract

```http
GET /evaluate?key=ai.canvas_generator&tenant_id=<uuid>&tier=pro
Authorization: Bearer <PROJECT_DELIVERY_API_KEY>
```

```json
{ "enabled": true }
```

- Project delivery keys only (platform admin key is rejected).
- Missing/invalid key → `401`.
- Unknown / inactive flag → `{ "enabled": false }`.

## Admin contract

All `/admin/*` routes require:

1. `Authorization: Bearer <FEATURE_FLAGS_API_KEY>`
2. `X-User-Id: <supabase-user-id>` (set by the Next.js BFF after session auth)

Projects are scoped by `user_id`. Cross-tenant access returns `404`.

Keep this API private to the BFF when possible. Possession of the platform admin key plus a victim’s user id is enough to act as that user.

## Local run

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .\.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8002
```

## Production checklist

- Set `APP_ENV=production` (disables `/docs` and loose CORS regex)
- Set a strong `FEATURE_FLAGS_API_KEY`
- Use Supabase **Session pooler** `DATABASE_URL` on IPv4-only hosts (e.g. Render)
- Set `CORS_ORIGINS` to your exact admin origin(s)
