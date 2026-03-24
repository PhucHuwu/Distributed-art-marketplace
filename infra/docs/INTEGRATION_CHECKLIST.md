# Integration Checklist (Before PR)

## Branch and scope

- Owner works on correct branch.
- Changes are within owned service scope.
- Shared/root changes are coordinated with root owner.

## Runtime and environment

- Service has `.env.example` and required env keys:
  - `SERVICE_PORT`
  - `DB_URL`
  - `RABBITMQ_URL`
  - `JWT_SECRET`
- Service can boot in docker-compose local stack.

## API and docs

- `GET /health` returns standard shape.
- `GET /docs` is reachable.
- `GET /openapi.json` is valid.
- Swagger includes all implemented endpoints.

## Event contract and messaging

- Published events use envelope v1 fields.
- Consumers are idempotent by `eventId`.
- Retry/backoff strategy exists.
- DLQ-ready naming follows broker conventions.
- Payload does not include sensitive secrets.

## Data and schema

- Prisma schema is isolated to owned service schema.
- No cross-schema write access.
- Migration history is included when schema changes.

## Quality checks

- Lint passes.
- Tests for service pass.
- Structured logs include `correlationId`.

## Smoke flow checks

- `order.created` can be consumed by inventory/audit.
- `inventory.reserved|failed` path works.
- `payment.success|failed` path works.
- `order.completed|failed` can be observed by notification/audit.
