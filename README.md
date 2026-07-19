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
├── middleware.ts                  # Supabase session gate
├── app/
│   ├── login/                     # Google / GitHub via Supabase OAuth
│   ├── (dashboard)/projects/...   # Multi-tenant admin UI
│   └── api/
│       ├── auth/callback/         # Supabase OAuth code exchange
│       ├── admin/[...path]/       # BFF → FastAPI /admin/* (+ X-User-Id)
│       └── evaluate/              # BFF → FastAPI /evaluate (public)
├── lib/supabase/                  # browser + server + middleware clients
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
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
FEATURE_FLAGS_API_URL=http://127.0.0.1:8002
FEATURE_FLAGS_ADMIN_API_KEY=dev-feature-flags-api-key
```

Supabase Dashboard → Authentication → URL configuration:

- Site URL: `http://localhost:3001`
- Redirect URL: `http://localhost:3001/api/auth/callback`

Google / GitHub provider’larını Supabase Auth içinde etkinleştir.

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

## Canlıya alma (Vercel + Render + Supabase)

### A) Render — FastAPI (DB = Supabase Postgres)

1. Render’da Web Service; root directory: `backend` (Dockerfile).  
2. Env:

| Key | Value |
| --- | --- |
| `DATABASE_URL` | Supabase **Session pooler** URI (`postgresql+psycopg://...@...pooler.supabase.com:5432/postgres?sslmode=require`) |
| `FEATURE_FLAGS_API_KEY` | Güçlü rastgele secret |
| `CORS_ORIGINS` | `https://<your-admin>.vercel.app` |

3. Healthcheck: `/health`  
4. Public API URL’yi not et.

> Render çoğu zaman **IPv6 outbound açamaz**. Supabase direct host (`db.<ref>.supabase.co`) IPv6’ya çözülürse startup `Network is unreachable` ile düşer. Dashboard → Database → Connect → **Session pooler** kullan.

### B) Vercel — Admin Next.js

1. Repo’yu Vercel’e import et (root = monorepo kökü).  
2. Env:

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | `https://<your-admin>.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `FEATURE_FLAGS_API_URL` | Render API URL |
| `FEATURE_FLAGS_ADMIN_API_KEY` | Render’daki `FEATURE_FLAGS_API_KEY` ile **aynı** |

Supabase redirect URL (production):

- `https://<your-admin>.vercel.app/api/auth/callback`

3. Deploy.  
4. Render `CORS_ORIGINS` içine Vercel URL’yi ekle.

### C) Canlı smoke test

1. `https://<admin>/projects` → project / flag / rule kur  
2. Flag sayfasındaki **Canlı test** ile doğrula  
3. SaaS Engine production env:

```env
FEATURE_FLAGS_BASE_URL=https://<railway-api>
FEATURE_FLAGS_API_KEY=<project_delivery_api_key>
```

## Güvenlik notları

- Admin panel: **Supabase Auth** ile Google / GitHub. Email/şifre yok.  
- Google veya GitHub ile giren her kullanıcı yetkilidir (allowlist yok).  
- Middleware + BFF: `/projects/*` ve `/api/admin/*` aktif Supabase session ister.  
- BFF, FastAPI’ye `X-User-Id: <supabase user.id>` ekler (multi-tenant hazırlık).  
- `GET /evaluate` (ve `/api/evaluate`) login gerektirmez — ürün API’leri bozulmaz.  
- Admin key yalnızca sunucuda: `FEATURE_FLAGS_ADMIN_API_KEY` (`NEXT_PUBLIC_` yok).  
- Delivery `api_key` proje bazlıdır; SaaS Engine secret’ıdır.  
- FastAPI `/admin/*` hâlâ admin API key ister; Next BFF key’i basmadan önce session zorunlu.  
- Alembic migrations sonraki sprint (`create_all` şimdilik bootstrap).

## Port notları (Windows)

- Yerel Postgres çakışması varsa Compose **5433** kullanır.  
- `8000` / `8001` doluysa API’yi `8002` ile çalıştır; `.env.local` içindeki `FEATURE_FLAGS_API_URL` ile eşleştir.
