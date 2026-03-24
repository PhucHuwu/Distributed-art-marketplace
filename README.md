# Distributed Art Marketplace

Distributed Art Marketplace is a backend-first, event-driven microservices system for a Vietnam-focused art e-commerce platform.

## Phase Scope

- Current phase: backend foundation and service contracts.
- Frontend implementation is out of scope in this phase.
- Architecture: Node.js microservices + PostgreSQL (multi-schema) + RabbitMQ + NGINX gateway + JWT.

## Monorepo Structure

- [`gateway/`](gateway/): NGINX routing for all backend services.
- [`infra/`](infra/): infrastructure assets and shared conventions.
- [`services/`](services/): domain microservices.
- [`frontend/`](frontend/): reserved for Next.js app in a later phase.

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

1. Copy root env template:

```bash
cp .env.example .env
```

2. Boot local stack:

```bash
docker compose up -d --build
```

3. Run smoke checks (see [Gateway Local Routes](#gateway-local-routes)):

```bash
bash scripts/smoke-local.sh
```

Optional full E2E event-flow validation on docker compose (includes migrate + smoke + event-flow):

```bash
npm run e2e:compose
```

4. Stop stack when done:

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
