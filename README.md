# Distributed Art Marketplace

Distributed Art Marketplace is a backend-first, event-driven microservices system for a Vietnam-focused art e-commerce platform.

## Phase Scope

- Current phase: backend foundation + integrated storefront frontend.
- Architecture: Node.js microservices + PostgreSQL (multi-schema) + RabbitMQ + NGINX gateway + JWT.

## Monorepo Structure

- [`gateway/`](gateway/): NGINX routing for all backend services.
- [`infra/`](infra/): infrastructure assets and shared conventions.
- [`services/`](services/): domain microservices.
- [`frontend/`](frontend/): Next.js storefront app integrated via gateway.

## Services and Schema Ownership

- `auth-service` -> schema `auth`
- `user-profile-service` -> schema `users`
- `catalog-service` -> schema `catalog`
- `inventory-service` -> schema `inventory`
- `order-service` -> schema `orders`
- `payment-service` -> schema `payments`
- `notification-service` -> no required DB schema for MVP
- `audit-log-service` -> schema `audit_logs`

Cross-service DB access is not allowed.

## Shared Runtime Conventions

All services must support the following environment variables:

- `SERVICE_PORT`
- `DB_URL`
- `RABBITMQ_URL`
- `JWT_SECRET`

All services must expose:

- `GET /health`
- `GET /docs`
- `GET /openapi.json`

## Quick Start (Local)

### 1) Install required tools

- Node.js 20+ and npm
- Docker Desktop (includes Docker Compose)
- Git

### 2) Clone and install

```bash
git clone https://github.com/PhucHuwu/Distributed-art-marketplace.git
cd Distributed-art-marketplace
npm install
```

### 3) Backend setup and run (Docker)

From repo root:

```bash
cp .env.example .env
docker compose up -d --build
```

Backend APIs will be available through gateway at `http://localhost/api/...`.

### 4) Frontend setup and run

Open a second terminal:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend will run at `http://localhost:3000`.

### 5) Run tests (optional)

From repo root:

```bash
npm run test:all
```

### 6) Stop backend services

From repo root:

```bash
docker compose down
```

## Gateway Local Routes

- Auth: `http://localhost/api/auth/*`
- User profile: `http://localhost/api/users/*`
- Catalog: `http://localhost/api/catalog/*`
- Inventory: `http://localhost/api/inventory/*`
- Orders: `http://localhost/api/orders/*`
- Payments: `http://localhost/api/payments/*`
- Notifications: `http://localhost/api/notifications/*`
- Admin audit: `http://localhost/api/admin/audit-logs/*`

Frontend CORS for local development is enabled at gateway for:

- `http://localhost:3000`
- `http://127.0.0.1:3000`

## Test Commands

- All unit/service tests in monorepo: `npm run test:all`
- Gateway smoke checks only: `npm run smoke:local`
- Event-driven E2E flow against running stack: `npm run e2e:event-flow`
- Full docker-compose E2E pipeline (boot, migrate, smoke, event-flow, teardown): `npm run e2e:compose`

Set `E2E_KEEP_STACK=true` to keep containers running after `npm run e2e:compose`.

## Core Docs

- [`project.md`](project.md)
- [`system-analysis-design.md`](system-analysis-design.md)
- [`TASK_ROOT.md`](TASK_ROOT.md)
- [`TASKS.md`](TASKS.md)
- [`SWAGGER_GUIDELINE.md`](SWAGGER_GUIDELINE.md)
- [`infra/docs/MONOREPO_CONVENTION.md`](infra/docs/MONOREPO_CONVENTION.md)
- [`infra/docs/RUNTIME_CONVENTIONS.md`](infra/docs/RUNTIME_CONVENTIONS.md)
- [`infra/docs/EVENT_CONTRACT_V1.md`](infra/docs/EVENT_CONTRACT_V1.md)
- [`infra/docs/BROKER_CONVENTIONS.md`](infra/docs/BROKER_CONVENTIONS.md)
- [`infra/docs/API_EVENT_NAMING.md`](infra/docs/API_EVENT_NAMING.md)
- [`infra/docs/INTEGRATION_CHECKLIST.md`](infra/docs/INTEGRATION_CHECKLIST.md)
- [`infra/docs/BOOT_TEST_REPORT.md`](infra/docs/BOOT_TEST_REPORT.md)
