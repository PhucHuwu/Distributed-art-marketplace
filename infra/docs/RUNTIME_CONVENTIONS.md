# Runtime Conventions

## Environment variable names

All services must expose and use the same variable keys:

- `SERVICE_PORT`: service internal HTTP port.
- `DB_URL`: service Prisma/PostgreSQL connection string.
- `RABBITMQ_URL`: broker URL for pub/sub.
- `JWT_SECRET`: shared token secret for local development.

## Root-level shared variables

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`
- `RABBITMQ_DEFAULT_USER`, `RABBITMQ_DEFAULT_PASS`, `RABBITMQ_PORT`, `RABBITMQ_MANAGEMENT_PORT`
- `GATEWAY_PORT`

## Port mapping convention

- Gateway public port: `80` (configurable with `GATEWAY_PORT`).
- Service default ports:
  - Auth: `3001`
  - User Profile: `3002`
  - Catalog: `3003`
  - Inventory: `3004`
  - Order: `3005`
  - Payment: `3006`
  - Notification: `3007`
  - Audit Log: `3008`

## Healthcheck standard

All services must provide `GET /health` and return:

```json
{
  "success": true,
  "service": "audit-log-service",
  "status": "ok",
  "timestamp": "2026-03-24T10:00:00.000Z"
}
```

Minimum required fields:

- `success`: boolean
- `service`: service name
- `status`: `ok` or `degraded`

Optional fields:

- `timestamp`
- `uptime`
- `dependencies`
