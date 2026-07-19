# Pulse Flag

B2B Feature Flag Management Platform.

- **Admin Dashboard** — Next.js (App Router) + Tailwind, Türkçe rehberli UI
- **Delivery API** — FastAPI + PostgreSQL (`GET /evaluate`)
- **Admin calls** — Next.js BFF (`/api/admin/*`); admin key tarayıcıya gitmez

## Sistem nasıl çalışır?

```text
Admin Panel  →  Project + Flag + Rule kaydeder
SaaS Engine  →  GET /evaluate?key=...&tenant_id=...
Pulse Flag   →  { "enabled": true|false }
SaaS Engine  →  özelliği açar / kapar
```

| Kavram | Anlam |
| --- | --- |
| **Project** | Çağıran ürün (örn. SaaS Engine) + delivery `api_key` |
| **FeatureFlag** | Sabit `key` (örn. `ai.canvas_generator`) |
| **Rule** | Hangi `tenant_id` / `tier` için açık |
| **Evaluate** | Motorun tek sorduğu endpoint |

## Klasör yapısı

```text
pulse-flag/
├── auth.ts                        # Auth.js (Google + GitHub + allowlist)
├── middleware.ts                  # Session gate for dashboard + admin BFF
├── app/
│   ├── login/                     # OAuth sign-in
│   ├── (dashboard)/projects/...   # Admin UI
│   └── api/
│       ├── auth/[...nextauth]/    # Auth.js handlers
│       ├── admin/[...path]/       # BFF → FastAPI /admin/* (session required)
│       └── evaluate/              # BFF → FastAPI /evaluate (public)
├── components/
├── lib/api.ts
├── backend/
│   ├── app/
│   ├── Dockerfile
│   └── railway.toml
└── docker-compose.yml
```

## Yerel geliştirme

### 1. Postgres

```bash
docker compose up -d
# host port: 5433
```

### 2. FastAPI

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8002
```

Health: `http://127.0.0.1:8002/health`  
Docs: `http://127.0.0.1:8002/docs`

### 3. Admin UI

```bash
copy .env.example .env.local
npm install
npm run dev
```

`.env.local` örneği:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3001
AUTH_SECRET=generate-a-long-random-string
AUTH_URL=http://localhost:3001
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
ADMIN_EMAILS=you@gmail.com
FEATURE_FLAGS_API_URL=http://127.0.0.1:8002
FEATURE_FLAGS_ADMIN_API_KEY=dev-feature-flags-api-key
```

OAuth callback URL’leri (Google Cloud Console / GitHub OAuth App):

- `http://localhost:3001/api/auth/callback/google`
- `http://localhost:3001/api/auth/callback/github`

Panel: `http://localhost:3001/projects` (oturum yoksa `/login`)

### Panel akışı (smoke)

1. **Yeni project** → SaaS Engine  
2. **api_key**’i kopyala  
3. **Flag oluştur** → `ai.canvas_generator`  
4. **Rule ekle** → kendi `tenant_id`  
5. **Canlı test** → `{ "enabled": true }` gör  

## SaaS Engine entegrasyonu

```http
GET https://<API_HOST>/evaluate?key=ai.canvas_generator&tenant_id=<WORKSPACE_UUID>
Authorization: Bearer <PROJECT_API_KEY>
```

Opsiyonel: `&tier=pro`

Cevap her zaman:

```json
{ "enabled": true }
```

## Canlıya alma (Vercel + Railway)

### A) Railway — Postgres + FastAPI

1. Railway’de yeni proje oluştur.  
2. **PostgreSQL** ekle.  
3. Backend service ekle; root directory: `backend` (Dockerfile kullanır).  
4. Env değişkenleri:

| Key | Value |
| --- | --- |
| `DATABASE_URL` | Railway Postgres URL (`postgresql+psycopg://...` — dialect `psycopg` olmalı) |
| `FEATURE_FLAGS_API_KEY` | Güçlü rastgele secret |
| `CORS_ORIGINS` | `https://<your-admin>.vercel.app` |

5. Healthcheck path: `/health` (`railway.toml` zaten ayarlı).  
6. Public URL’yi not et → örn. `https://pulse-flag-api.up.railway.app`

> `DATABASE_URL` Railway’den `postgres://` gelirse başına `postgresql+psycopg://` olacak şekilde düzenle veya connection string’i dönüştür.

### B) Vercel — Admin Next.js

1. Repo’yu Vercel’e import et (root = monorepo kökü).  
2. Env:

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | `https://<your-admin>.vercel.app` |
| `AUTH_SECRET` | Güçlü rastgele secret (`openssl rand -base64 32`) |
| `AUTH_URL` | `https://<your-admin>.vercel.app` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth client |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth App |
| `ADMIN_EMAILS` | Virgülle ayrılmış yönetici e-postaları |
| `FEATURE_FLAGS_API_URL` | Railway API URL |
| `FEATURE_FLAGS_ADMIN_API_KEY` | Railway’deki `FEATURE_FLAGS_API_KEY` ile **aynı** |

Production OAuth callbacks:

- `https://<your-admin>.vercel.app/api/auth/callback/google`
- `https://<your-admin>.vercel.app/api/auth/callback/github`

3. Deploy.  
4. Railway `CORS_ORIGINS` içine Vercel URL’yi ekle (direkt tarayıcı denemeleri için).

### C) Canlı smoke test

1. `https://<admin>/projects` → project / flag / rule kur  
2. Flag sayfasındaki **Canlı test** ile doğrula  
3. SaaS Engine production env:

```env
FEATURE_FLAGS_BASE_URL=https://<railway-api>
FEATURE_FLAGS_API_KEY=<project_delivery_api_key>
```

## Güvenlik notları

- Admin panel: **yalnızca Google / GitHub** (Auth.js). Email/şifre yok.  
- Giriş `ADMIN_EMAILS` allowlist’ine bağlıdır; listede olmayan OAuth hesabı reddedilir.  
- Middleware + BFF `auth()`: `/projects/*` ve `/api/admin/*` oturum ister.  
- `GET /evaluate` (ve `/api/evaluate`) login gerektirmez — ürün API’leri bozulmaz.  
- Admin key yalnızca sunucuda: `FEATURE_FLAGS_ADMIN_API_KEY` (`NEXT_PUBLIC_` yok).  
- Delivery `api_key` proje bazlıdır; SaaS Engine secret’ıdır.  
- FastAPI `/admin/*` hâlâ admin API key ister; Next BFF key’i basmadan önce session zorunlu.  
- Alembic migrations sonraki sprint (`create_all` şimdilik bootstrap).

## Port notları (Windows)

- Yerel Postgres çakışması varsa Compose **5433** kullanır.  
- `8000` / `8001` doluysa API’yi `8002` ile çalıştır; `.env.local` içindeki `FEATURE_FLAGS_API_URL` ile eşleştir.
