# Cross-Service API and Event Naming Convention

## HTTP API naming

- Use lowercase paths and kebab-case segments.
- Use plural nouns for resource collections.
- Keep bounded context prefix in route path where applicable.

Examples:

- `POST /auth/register`
- `GET /users/me`
- `GET /catalog/artworks`
- `POST /inventory/reserve`
- `POST /orders`
- `POST /payments`
- `GET /admin/audit-logs`

## OpenAPI documentation endpoints

- `GET /docs`
- `GET /openapi.json`
- `GET /health`

## Event type naming

- Use `<domain>.<action>` format.
- Keep event action in past tense for completed domain outcome.

Examples:

- `order.created`
- `inventory.reserved`
- `inventory.failed`
- `payment.success`
- `payment.failed`
- `order.completed`
- `order.failed`
- `order.cancelled`

## Producer name convention

- Use service folder name in lowercase.
- Examples:
  - `auth-service`
  - `order-service`
  - `audit-log-service`

## Correlation and traceability

- Every API request generates or reuses a `correlationId`.
- `correlationId` must be propagated to all emitted events.
