# E-Comm CI/CD

Production-ready ecommerce monorepo: React storefront + Express REST API + PostgreSQL/Prisma.

## Stack

| Layer    | Technology |
| -------- | ---------- |
| Frontend | React (Vite), TailwindCSS, React Router, Zustand, Framer Motion, Stripe Elements |
| Backend  | Node.js, Express, JWT + refresh cookies, Zod, Pino, Stripe |
| Database | PostgreSQL + Prisma ORM |
| Tooling  | ESLint, Prettier, Jest/Supertest, Vitest, Docker, GitHub Actions |

## Folder structure

```
.
├── client/                 # React + Vite frontend
├── server/                 # Express REST API + Prisma
├── docker-compose.yml
├── .github/workflows/ci.yml
└── package.json            # npm workspaces root
```

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (or Docker)
- Stripe test keys (for checkout)

## Setup

```bash
npm install

cp client/.env.example client/.env
cp server/.env.example server/.env
# Edit secrets: DATABASE_URL, JWT_*, STRIPE_*
```

### Database (Prompt 2 migration)

From the repo root (or `server/`):

```bash
# Generate client + apply initial migration
npm run db:generate
cd server && npx prisma migrate dev --name init
# If the migration folder already exists, use:
# npx prisma migrate deploy

# Seed demo admin/customer + products
npm run db:seed
```

**Demo accounts (after seed)**  
- Admin: `admin@ecomm.local` / `Admin123!`  
- Customer: `customer@ecomm.local` / `Customer123!`

## Run

```bash
npm run dev:client   # http://localhost:5173
npm run dev:server   # http://localhost:5000
```

```bash
npm test
npm run lint
npm run build
```

## API overview

| Area | Endpoints |
| ---- | --------- |
| Auth | `POST /api/auth/register\|login\|refresh\|logout\|forgot-password\|reset-password`, `GET /api/auth/me` |
| Products | `GET /api/products`, `GET /api/products/:slug`, admin CRUD |
| Categories | `GET /api/categories`, admin CRUD |
| Cart | `GET/POST/PATCH/DELETE /api/cart...` (guest via `guestId`) |
| Orders | `POST/GET /api/orders`, `GET/PATCH /api/admin/orders` |
| Payments | `POST /api/payments/create-intent`, webhook, admin refund |
| Health | `GET /api/health` |

Response envelope: `{ success, data, message, error?, meta? }`.

## Frontend routes

`/`, `/products`, `/products/:slug`, `/cart`, `/checkout`, `/login`, `/register`, `/account`, `/admin/*`, `/styleguide`

## Docker

```bash
docker compose up --build
```

- API: `http://localhost:5000`
- Client (nginx): `http://localhost:8080`
- Postgres: `localhost:5432`
- Redis: `localhost:6379` (reserved for future cache swap)

## Deployment

### Backend (Render / Railway / Fly.io)

1. Connect the repo; set root to `server` (or build from monorepo with `npm install` + `npm run start --workspace=server`).
2. Provision PostgreSQL; set `DATABASE_URL`.
3. Set env vars from `server/.env.example` (use strong JWT secrets, `COOKIE_SECURE=true`, real Stripe keys).
4. Release command: `npx prisma migrate deploy`
5. Start: `node src/index.js`
6. Point Stripe webhook to `https://<api>/api/payments/webhook`

### Frontend (Vercel / Netlify)

1. Root directory: `client`
2. Build: `npm run build`
3. Output: `dist`
4. Env: `VITE_API_URL=https://<api>/api`, `VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...`
5. Never put server secrets in `VITE_*` vars

## Production launch checklist

- [ ] All env vars set (JWT, DB, Stripe, `CLIENT_URL`, `COOKIE_SECURE=true`)
- [ ] `prisma migrate deploy` succeeded
- [ ] Stripe webhook signature verified in live mode
- [ ] HTTPS enforced at the edge
- [ ] DB backups enabled
- [ ] Error monitoring (e.g. Sentry) wired on client + server
- [ ] Analytics (e.g. Plausible/GA) added
- [ ] Admin account password rotated from seed defaults
- [ ] Rate limits reviewed for your traffic profile
- [ ] Lighthouse pass on home + product pages (LCP/CLS)

## Security notes (Prompt 17)

| Issue | Fix applied |
| ----- | ----------- |
| Secrets in JWT | Access token carries only `sub` + `role`; user reloaded from DB in `authenticate` |
| Brute-force login | `authLimiter` on login/register |
| Refresh token theft | httpOnly cookie, rotate on refresh, revoke on logout/password reset |
| XSS via uploads | MIME allowlist + size limit (multer) |
| Stripe webhook spoofing | Raw body + signature verification |
| Admin route bypass | Backend `authorize('ADMIN')` + frontend `AdminRoute` |
| Helmet/CSP | Enabled in production |
| SQL injection | Prisma queries; stock update uses parameterized `$executeRaw` |
| Env leakage | Only `VITE_*` exposed to client bundle |
| CSRF (cookie auth) | Refresh cookie scoped to `/api/auth`, `SameSite=Lax`; mutations use Bearer access token |

## Lighthouse checklist (Prompt 16)

- Route-level code splitting (`React.lazy`)
- Image `loading="lazy"` + hero `fetchPriority="high"`
- `robots.txt` + `sitemap.xml`
- Compression middleware on API
- Product list in-memory cache (30s TTL)
- Avoid layout shift: fixed aspect ratios on product images
