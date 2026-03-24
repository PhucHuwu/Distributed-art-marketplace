# Distributed Art Marketplace

Distributed Art Marketplace is a backend-first, event-driven microservices system for a Vietnam-focused art ecommerce platform.

## Phase scope

- Current phase: backend foundation and service contracts.
- Frontend implementation is out of scope in this phase.
- Architecture: Node.js microservices + PostgreSQL (multi-schema) + RabbitMQ + NGINX gateway + JWT.

## Monorepo structure

- `gateway/`: NGINX routing for all backend services.
- `infra/`: infrastructure assets and shared conventions.
- `services/`: domain microservices.
- `frontend/`: reserved for Next.js app in later phase.

## Services and schema ownership

- `auth-service` -> schema `auth`
- `user-profile-service` -> schema `users`
- `catalog-service` -> schema `catalog`
- `inventory-service` -> schema `inventory`
- `order-service` -> schema `orders`
- `payment-service` -> schema `payments`
- `notification-service` -> no required DB schema for MVP
- `audit-log-service` -> schema `audit_logs`

Cross-service DB access is not allowed.

## Shared runtime conventions

All services must support the following env variables:

- `SERVICE_PORT`
- `DB_URL`
- `RABBITMQ_URL`
- `JWT_SECRET`

All services must expose:

- `GET /health`
- `GET /docs`
- `GET /openapi.json`

## Quick start (local)

1. Copy root env template:

```bash
cp .env.example .env
```

2. Boot local stack:

```bash
docker compose up -d --build
```

3. Run smoke checks:

```bash
bash scripts/smoke-local.sh
```

4. Stop stack when done:

```bash
docker compose down
```

## Gateway local routes

- Auth: `http://localhost/api/auth/*`
- User profile: `http://localhost/api/users/*`
- Catalog: `http://localhost/api/catalog/*`
- Inventory: `http://localhost/api/inventory/*`
- Orders: `http://localhost/api/orders/*`
- Payments: `http://localhost/api/payments/*`
- Notifications: `http://localhost/api/notifications/*`
- Admin audit: `http://localhost/api/admin/audit-logs/*`

## Core docs

- `project.md`
- `system-analysis-design.md`
- `TASK_ROOT.md`
- `TASKS.md`
- `SWAGGER_GUIDELINE.md`
- `infra/docs/MONOREPO_CONVENTION.md`
- `infra/docs/RUNTIME_CONVENTIONS.md`
- `infra/docs/EVENT_CONTRACT_V1.md`
- `infra/docs/BROKER_CONVENTIONS.md`
- `infra/docs/API_EVENT_NAMING.md`
- `infra/docs/INTEGRATION_CHECKLIST.md`
- `infra/docs/BOOT_TEST_REPORT.md`
