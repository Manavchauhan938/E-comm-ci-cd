# Deploy guide — Netlify (SPA + API) + Neon + GitHub Actions

The whole app runs on **[Netlify](https://app.netlify.com/teams/manavchauhan938/projects)**:

| Piece | Where it runs |
| ----- | ------------- |
| **Client** (React/Vite) | Netlify static hosting (`client/dist`) |
| **API** (Express + Prisma) | Netlify Function (`netlify/functions/api.js`) at `/api/*` |
| **Database** | **[Neon](https://console.neon.tech)** Postgres (`DATABASE_URL`) |

Pipeline on every push to `main`:

```
Test → Build & push Docker images (GHCR, optional) → Deploy SPA + Functions to Netlify
```

Live site: **https://ecomm-ci-cd.netlify.app**

---

## How the API works on Netlify

1. `netlify.toml` rewrites `/api/*` → `/.netlify/functions/api/:splat`
2. The function wraps Express with `serverless-http`
3. Set these on the Netlify site (Site configuration → Environment variables):

| Name | Notes |
| ---- | ----- |
| `DATABASE_URL` | Neon pooler URL (`?sslmode=require`) |
| `JWT_ACCESS_SECRET` | Long random secret |
| `JWT_REFRESH_SECRET` | Long random secret |
| `CLIENT_URL` | `https://ecomm-ci-cd.netlify.app` |
| `COOKIE_SECURE` | `true` |
| `NODE_ENV` | `production` |
| `VITE_API_URL` | `/api` (same-origin) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Optional |
| `STRIPE_SECRET_KEY` | Optional |

Scopes: secrets need **builds**, **functions**, and **runtime**.

---

## GitHub Actions secrets

| Name | Value |
| ---- | ----- |
| `NETLIFY_AUTH_TOKEN` | Netlify personal access token |
| `NETLIFY_SITE_ID` | `7a4121b7-ed10-46fa-8269-a1f60e8e0afe` |
| `DATABASE_URL` | Same Neon URL (for Prisma generate / migrate in CI) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Same as Netlify |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Optional |

---

## Neon database

```bash
cd server
npx prisma migrate deploy
npm run prisma:seed
```

Use the **pooler** connection string for serverless (Netlify Functions).

---

## Trigger deploy

```bash
git push origin main
```

Or: GitHub → **Actions** → **CI/CD** → **Run workflow**.

Verify: https://ecomm-ci-cd.netlify.app/api/health

---

## Local development

```bash
# Terminal 1 — API + embedded Postgres
cd server && npm run dev:db
cd server && npm run dev

# Terminal 2 — Vite client (VITE_API_URL=http://localhost:5000/api)
cd client && npm run dev
```

---

## Docker (optional / local)

```bash
docker compose up --build
```

Images are still published to GHCR on `main` pushes; production traffic uses Netlify + Neon, not Render.
