# Inventory Service

Write-heavy service for stock consistency, reservation lifecycle, and event-driven inventory updates.

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
- `RABBITMQ_RETRY_QUEUE`
- `RABBITMQ_DLQ_QUEUE`
- `RABBITMQ_DLX`
- `RABBITMQ_CONSUME_ROUTING_KEYS`

## Run locally

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## HTTP endpoints

- `GET /health`
- `GET /openapi.json`
- `GET /docs`
- `GET /inventory/:artworkId`
- `POST /inventory/adjust` (Admin)
- `POST /inventory/reserve` (Admin/internal)
- `POST /inventory/release` (Admin/internal)

## Event flow

Consume:

- `order.created`

Publish:

- `inventory.reserved`
- `inventory.failed`

Idempotency:

- Event deduplication by `eventId` via `processed_events` table.

Retry and DLQ baseline:

- Retry delays from `RABBITMQ_RETRY_DELAYS_MS` (default: `5000,30000,120000`).
- Failed messages after max retries are moved to `RABBITMQ_DLQ_QUEUE`.

## Stock consistency rule

Invariant enforced in transaction flow:

- `on_hand_qty - reserved_qty >= 0`

## Swagger URL

- Local: `http://localhost:3004/docs`
