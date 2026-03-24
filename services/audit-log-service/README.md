# Audit Log Service

Central audit consumer and admin query API for cross-service traceability.

## Environment

Copy template and update values:

```bash
cp .env.example .env
```

Required keys:

- `SERVICE_PORT`
- `DB_URL`
- `RABBITMQ_URL`
- `JWT_SECRET`
- `SERVICE_NAME`
- `RABBITMQ_EXCHANGE`
- `RABBITMQ_QUEUE`
- `RABBITMQ_ROUTING_KEYS`

## Run locally

```bash
npm install
npm run dev
```

## Endpoints

- `GET /health`
- `GET /openapi.json`
- `GET /docs`
- `GET /admin/audit-logs`
- `GET /admin/audit-logs/:eventId`

## Event subscriptions

- `order.*`
- `inventory.*`
- `payment.*`

## Event envelope

Must follow v1 envelope with fields:

- `eventId`
- `eventType`
- `occurredAt`
- `producer`
- `correlationId`
- `version`
- `payload`

## Swagger URL

- Local: `http://localhost:3008/docs`
