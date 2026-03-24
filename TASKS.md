# Task Breakdown - Distributed Art Marketplace

## Team setup

- Team members / working branches: `phucth`, `anhlt`, `datlt`, `vubn`, `tuanhm`
- Rule: one service has exactly one owner to avoid direct code conflict.
- Rule: each dev works only on their branch; PR target branch is `develop`.
- Rule: root/shared files are coordinated by leader to avoid cross-service conflict.
- Rule: current phase is backend-only. No frontend implementation in this phase.

## ROOT task (Leader)

### ROOT-01 - Complete root foundation and integration baseline

- Owner: `phucth`
- Branch: `phucth`
- Scope:
  - Standardize backend monorepo skeleton for `gateway`, `infra`, and 8 services.
  - Finalize root `docker-compose.yml` for PostgreSQL, RabbitMQ, gateway, and service runtime wiring.
  - Define shared runtime conventions (env naming, port mapping, healthcheck route naming).
  - Define and document shared event envelope v1 and correlation/idempotency rules.
  - Define Swagger/OpenAPI convention for all services.
  - Publish local development runbook and integration checklist.
- Deliverables:
  - Root-level technical docs for architecture quickstart and service integration conventions.
  - Local environment can run smoke flow successfully.
- Acceptance criteria:
  - All services can boot with unified local config.
  - Shared conventions are documented and approved by the team.
  - All services expose Swagger UI to test API endpoints.
  - End-to-end event flow can be validated in local environment.

## Service tasks

### SVC-01 - Auth Service

- Owner: `anhlt`
- Branch: `anhlt`
- Path: `services/auth-service`
- Goals:
  - Implement `POST /auth/register`, `POST /auth/login`, `GET /auth/verify`.
  - Use secure password hashing (bcrypt/argon2).
  - Issue and verify JWT; prepare refresh flow if included in MVP scope.
  - Expose Swagger UI + OpenAPI spec for auth endpoints.
  - Add schema `auth` with Prisma migration baseline.
- Acceptance criteria:
  - Auth APIs pass basic happy-path and invalid-credential cases.
  - No plain password stored or exposed in logs/events.

### SVC-02 - User Profile Service

- Owner: `anhlt`
- Branch: `anhlt`
- Path: `services/user-profile-service`
- Goals:
  - Implement `/users/me` profile read/update.
  - Implement address CRUD and default address selection.
  - Expose Swagger UI + OpenAPI spec for user profile endpoints.
  - Add schema `users` with Prisma migration baseline.
- Acceptance criteria:
  - Address CRUD works with validation and default uniqueness rule.
  - APIs are secured using JWT identity.

### SVC-03 - Catalog Service

- Owner: `datlt`
- Branch: `datlt`
- Path: `services/catalog-service`
- Goals:
  - Implement artwork list/detail APIs (read-heavy).
  - Implement admin CRUD for artworks/artists/categories.
  - Support search/filter by author, price range, and category.
  - Expose Swagger UI + OpenAPI spec for catalog endpoints.
  - Add schema `catalog` with Prisma migration baseline.
- Acceptance criteria:
  - Public read APIs return stable pagination/filter response.
  - Admin write APIs enforce basic authorization.

### SVC-04 - Inventory Service

- Owner: `datlt`
- Branch: `datlt`
- Path: `services/inventory-service`
- Goals:
  - Implement stock reserve/release/adjust APIs.
  - Consume `order.created`; publish `inventory.reserved` or `inventory.failed`.
  - Enforce stock consistency rule: `on_hand_qty - reserved_qty >= 0`.
  - Expose Swagger UI + OpenAPI spec for inventory endpoints.
  - Add schema `inventory` with Prisma migration baseline.
- Acceptance criteria:
  - Idempotent event handling by `eventId`.
  - Reserve/release race conditions are handled safely.

### SVC-05 - Payment Service

- Owner: `vubn`
- Branch: `vubn`
- Path: `services/payment-service`
- Goals:
  - Implement payment creation endpoint.
  - Manage payment state machine: `INITIATED -> PROCESSING -> SUCCESS/FAILED`.
  - Publish `payment.success` / `payment.failed` events.
  - Add webhook endpoint stub for payment provider callbacks.
  - Expose Swagger UI + OpenAPI spec for payment endpoints.
  - Add schema `payments` with Prisma migration baseline.
- Acceptance criteria:
  - Payment status transitions are validated and auditable.
  - Success/failure event emission is reliable and traceable.

### SVC-06 - Notification Service

- Owner: `vubn`
- Branch: `vubn`
- Path: `services/notification-service`
- Goals:
  - Consume `order.completed`, `order.failed`, and `payment.failed` events.
  - Implement email/SMS sender abstraction with mock provider for MVP.
  - Implement retry/backoff and failed message handling strategy.
  - Expose Swagger UI for available internal/debug endpoints and include event contract in OpenAPI description.
- Acceptance criteria:
  - Notifications are sent for key business events.
  - Failed sends are retried and logged with correlation ID.

### SVC-07 - Order Service

- Owner: `tuanhm`
- Branch: `tuanhm`
- Path: `services/order-service`
- Goals:
  - Implement cart item add/update/remove APIs.
  - Implement order creation with initial status `PENDING` and publish `order.created`.
  - Consume inventory/payment events and update order lifecycle.
  - Expose Swagger UI + OpenAPI spec for order endpoints.
  - Add schema `orders` with Prisma migration baseline.
- Acceptance criteria:
  - Status transitions follow designed lifecycle.
  - History table tracks meaningful status changes.

### SVC-08 - Audit Log Service (Admin)

- Owner: `phucth`
- Branch: `phucth`
- Path: `services/audit-log-service`
- Goals:
  - Consume all core domain events as central audit consumer.
  - Persist normalized logs into schema `audit_logs`.
  - Implement admin query APIs by `userId`, `orderId`, `service`, `eventType`, time range.
  - Expose Swagger UI + OpenAPI spec for admin audit endpoints.
- Acceptance criteria:
  - Major system events are traceable end-to-end.
  - Query API supports incident investigation needs.

## Mandatory notes for every task

- Core stack (backend phase): Node.js services, PostgreSQL + Prisma, RabbitMQ, JWT, NGINX gateway.
- Swagger requirement: each service must expose OpenAPI JSON and Swagger UI for API testing.
- Database rule: one PostgreSQL instance, isolated schema per service. No cross-schema write access.
- Event contract must include: `eventId`, `eventType`, `occurredAt`, `producer`, `correlationId`, `version`, `payload`.
- Consumer rules: idempotent processing by `eventId`, retry with backoff, DLQ-ready design.
- Security baseline:
  - Never publish sensitive data in events (password/token raw values).
  - Password must be hashed; auth secrets loaded from env.
- Observability baseline:
  - Healthcheck endpoint per service.
  - Structured logs with `correlationId`.
- Domain states:
  - Order: `PENDING`, `AWAITING_PAYMENT`, `COMPLETED`, `FAILED`, `CANCELLED`.
  - Payment: `INITIATED`, `PROCESSING`, `SUCCESS`, `FAILED`.

## Coordination policy to minimize conflicts

- Only service owner edits files under their service folder.
- Shared files (`docker-compose.yml`, gateway config, root package/tooling, shared contracts/docs) go through `ROOT-01` owner (`phucth`).
- Any API/event contract change must include doc update and team announcement before merge.
- Integration cadence:
  - Rebase daily from `develop`.
  - Resolve conflicts on owner branch before opening PR.
  - Keep PR scope focused to one task.
