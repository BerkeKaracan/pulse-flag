# Pulse Flag

Multi-tenant **feature flag** platform for B2B products.

Sign in with Google or GitHub, create a project, define flags and targeting rules, then let your app ask a single delivery endpoint whether a feature is on for a given tenant.

```text
Admin UI (Next.js)  →  create project / flag / rule
Your product API    →  GET /evaluate?key=...&tenant_id=...
Pulse Flag API      →  { "enabled": true | false }
Your product        →  turn the feature on or off
```

| Concept | Meaning |
| --- | --- |
| **Project** | A consumer product (e.g. your SaaS) with its own delivery `api_key` |
| **Feature flag** | Stable string key (e.g. `ai.canvas_generator`) |
| **Rule** | Who gets the flag: `tenant_id` and/or plan `tier` allowlists |
| **Evaluate** | The only call your product needs in production |

---

## Stack

| Layer | Tech |
| --- | --- |
| Admin UI | Next.js App Router, Supabase Auth (Google / GitHub) |
| Delivery + admin API | FastAPI, SQLAlchemy, PostgreSQL (Supabase or local Docker) |
| Trust boundary | Next.js BFF holds the platform admin key; browsers never see it |

```text
pulse-flag/
├── app/                  # Next.js admin + BFF
├── lib/supabase/         # SSR Supabase clients
├── middleware.ts         # Session gate
├── backend/              # FastAPI service
└── docker-compose.yml    # Local Postgres
```

---

## Security model (read this before deploying)

Pulse Flag is designed so a **shared admin URL** is not enough to manage flags.

### What protects what

| Surface | Protection |
| --- | --- |
| Admin UI (`/projects`, …) | Supabase session (Google / GitHub OAuth) |
| Next BFF `/api/admin/*` | Supabase session **and** server-side platform admin key |
| FastAPI `/admin/*` | Platform `FEATURE_FLAGS_API_KEY` **and** verified Supabase access JWT (`sub` = owner) |
| FastAPI `GET /evaluate` | **Project delivery** `api_key` only (not the platform admin key) |
| Multi-tenant isolation | Each project stores `user_id` (Supabase user id); list/update/delete are scoped |

### Hard rules

1. **Never** put `FEATURE_FLAGS_ADMIN_API_KEY` / `FEATURE_FLAGS_API_KEY` in `NEXT_PUBLIC_*` env vars.
2. Treat the FastAPI admin API as **private infrastructure**. Prefer calling it only from the Next.js BFF. Admin routes need the platform key **and** a valid Supabase user JWT (verified with `SUPABASE_JWT_SECRET`).
3. Product backends call **`GET /evaluate` with the project delivery key**, not the platform admin key.
4. Empty targeting lists mean **match nobody** (no silent “enable for everyone”).
5. In production set `APP_ENV=production` on the API (hides `/docs` and disables the loose CORS regex).

### OAuth note

Any Google/GitHub account that can complete Supabase Auth can use the admin UI and own their own projects. There is **no email allowlist**. If you need a private console, restrict providers / users in the Supabase dashboard (or add an allowlist later).

---

## Quick start (local)

### 1. Postgres

```bash
docker compose up -d
# host port: 5433
```

### 2. FastAPI

```bash
cd backend
python -m venv .venv
# Windows: .\.venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # Windows: copy .env.example .env
uvicorn app.main:app --reload --port 8002
```

- Health: `http://127.0.0.1:8002/health`
- Docs (dev only): `http://127.0.0.1:8002/docs`

### 3. Admin UI

```bash
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm install
npm run dev -- --port 3001
```

Example `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
FEATURE_FLAGS_API_URL=http://127.0.0.1:8002
FEATURE_FLAGS_ADMIN_API_KEY=change-me-to-a-long-random-secret
```

`FEATURE_FLAGS_ADMIN_API_KEY` must match backend `FEATURE_FLAGS_API_KEY`.

**Supabase Auth**

- Enable Google and/or GitHub providers
- Site URL: `http://localhost:3001`
- Redirect URL: `http://localhost:3001/api/auth/callback`

Open `http://localhost:3001/login`.

### Smoke path

1. Create a **project** → copy the delivery `api_key`
2. Create a **flag** (e.g. `ai.canvas_generator`)
3. Add a **rule** for your `tenant_id` (and optional `tier`)
4. Use **Live test** on the flag page → `{ "enabled": true }`

---

## Delivery API (for your product)

```http
GET /evaluate?key=ai.canvas_generator&tenant_id=<WORKSPACE_UUID>&tier=pro
Authorization: Bearer <PROJECT_DELIVERY_API_KEY>
```

Response is always:

```json
{ "enabled": true }
```

Unknown or inactive flags fail closed (`enabled: false`).

---

## Production deploy

### A) API — Render (or similar) + Supabase Postgres

| Env | Value |
| --- | --- |
| `DATABASE_URL` | Supabase **Session pooler** URI (`…@…pooler.supabase.com:5432/postgres?sslmode=require`), scheme `postgresql+psycopg://` |
| `FEATURE_FLAGS_API_KEY` | Long random secret (`openssl rand -hex 32`) |
| `SUPABASE_URL` | Same Supabase project URL as the admin app |
| `SUPABASE_ANON_KEY` | Same anon key as the admin app (verifies user JWTs via Auth API) |
| `SUPABASE_JWT_SECRET` | Optional legacy HS256 secret |
| `APP_ENV` | `production` |
| `CORS_ORIGINS` | Exact admin origin, e.g. `https://your-admin.vercel.app` |

Root directory: `backend`. Health check: `/health`.

> **IPv6:** Many hosts cannot dial Supabase’s direct `db.*.supabase.co` address. Use the **Session pooler** connection string or you will see `Network is unreachable` on startup.

### B) Admin UI — Vercel

| Env | Value |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | `https://your-admin.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `FEATURE_FLAGS_API_URL` | Public API base URL |
| `FEATURE_FLAGS_ADMIN_API_KEY` | Same value as API `FEATURE_FLAGS_API_KEY` |

Supabase redirect URL:

`https://your-admin.vercel.app/api/auth/callback`

### C) Wire your product

```env
FEATURE_FLAGS_URL=https://your-api.onrender.com
FEATURE_FLAGS_API_KEY=<project_delivery_api_key>
```

---

## License / status

Early open share — schema bootstrap uses `create_all` (Alembic can come later). Contributions and issues welcome once you fork or clone.
