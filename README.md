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

See **[DEPLOY.md](./DEPLOY.md)** for the full GitHub Actions → Docker → Netlify + Render guide.

Quick summary:

- **Frontend** → Netlify (`netlify.toml`)
- **API** → Docker image on GHCR + Render Blueprint (`render.yaml`)
- **CI/CD** → `.github/workflows/ci.yml` (test → Docker push → Netlify deploy)
