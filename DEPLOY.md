# Deploy guide — GitHub Actions + Docker + Netlify

This project has **two deployables**:

| Piece | Where it runs | Why |
| ----- | ------------- | --- |
| **Client** (React/Vite) | **[Netlify](https://app.netlify.com/teams/manavchauhan938/projects)** | Static SPA hosting |
| **API** (Express + Prisma + Postgres) | **Render** (or Railway/Fly) via **Docker** | Netlify cannot run a long-lived Node + Postgres API |

Pipeline on every push to `main`:

```
Test → Build & push Docker images (GHCR) → Deploy client to Netlify
```

---

## Step 1 — Create a Netlify site (do this in your open browser)

1. Open [https://app.netlify.com/teams/manavchauhan938/projects](https://app.netlify.com/teams/manavchauhan938/projects)
2. Click **Add new project** → **Import an existing project**
3. Choose **GitHub** and authorize Netlify if asked
4. Select repo: **`Manavchauhan938/E-comm-ci-cd`**
5. Build settings (should match `netlify.toml`):
   - **Base directory:** leave blank / `.`
   - **Build command:** `npm install --legacy-peer-deps && npm run build --workspace=client`
   - **Publish directory:** `client/dist`
6. Click **Deploy** (first deploy may fail until env vars are set — that’s OK)
7. After create, open **Site configuration** → **Site details** and copy:
   - **Site ID** (also called API ID)

---

## Step 2 — Create a Netlify personal access token

1. Open [https://app.netlify.com/user/applications#personal-access-tokens](https://app.netlify.com/user/applications#personal-access-tokens)
2. **New access token** → name it `github-actions` → copy the token once

---

## Step 3 — Add GitHub secrets & variables

Open: [https://github.com/Manavchauhan938/E-comm-ci-cd/settings/secrets/actions](https://github.com/Manavchauhan938/E-comm-ci-cd/settings/secrets/actions)

### Secrets (Actions → Secrets)

| Name | Value |
| ---- | ----- |
| `NETLIFY_AUTH_TOKEN` | Token from Step 2 |
| `NETLIFY_SITE_ID` | Site ID from Step 1 |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key (or `pk_test_placeholder`) |

### Variables (Actions → Variables)

| Name | Value |
| ---- | ----- |
| `VITE_API_URL` | Your live API URL, e.g. `https://ecomm-api.onrender.com/api` |

> Until the API is live, you can temporarily set `VITE_API_URL` to `https://localhost:5000/api` — the storefront will build, but live data calls will fail until Step 4 is done.

---

## Step 4 — Deploy the API with Docker (Render)

Netlify only hosts the UI. Deploy the API like this:

1. Go to [https://dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**
2. Connect the same GitHub repo
3. Render reads `render.yaml` and creates:
   - Postgres database
   - Docker web service from `server/Dockerfile`
4. Set env vars in Render:
   - `CLIENT_URL` = your Netlify URL, e.g. `https://your-site.netlify.app`
   - `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` (optional for payments)
5. After the API is live, copy its URL and update GitHub variable:
   - `VITE_API_URL` = `https://YOUR-API.onrender.com/api`
6. Also set the same `VITE_API_URL` under **Netlify → Site configuration → Environment variables**
7. Re-run the GitHub Action (or push a small commit) so Netlify gets a rebuild with the correct API URL

### Docker images (automatic)

On each successful `main` push, Actions pushes:

- `ghcr.io/manavchauhan938/ecomm-api:latest`
- `ghcr.io/manavchauhan938/ecomm-client:latest`

(Packages may be private under your GitHub account → **Packages**.)

---

## Step 5 — Trigger the pipeline

```bash
git add .
git commit -m "chore: trigger deploy"
git push origin main
```

Or: GitHub → **Actions** → **CI/CD** → **Run workflow**.

Watch:

1. **Test** (green)
2. **Build & push Docker images** (green)
3. **Deploy frontend to Netlify** (green)

Then open your Netlify URL.

---

## Local Docker (optional)

```bash
docker compose up --build
```

- API: http://localhost:5000  
- Client (nginx): http://localhost:8080  

---

## Checklist

- [ ] Netlify site created from GitHub repo
- [ ] `NETLIFY_AUTH_TOKEN` + `NETLIFY_SITE_ID` in GitHub secrets
- [ ] API deployed (Render Blueprint / Docker)
- [ ] `VITE_API_URL` points at live API
- [ ] `CLIENT_URL` on API points at Netlify URL
- [ ] CI/CD workflow green on Actions
