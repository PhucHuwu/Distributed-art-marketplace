# Order Service

Order service manages cart APIs, order creation, and order lifecycle transitions via event-driven choreography.

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

## Endpoints

- `GET /health`
- `GET /openapi.json`
- `GET /docs`
- `GET /orders/cart`
- `POST /orders/cart/items`
- `PUT /orders/cart/items/:id`
- `DELETE /orders/cart/items/:id`
- `POST /orders`
- `GET /orders/:orderId`
- `GET /orders/me`

## Event choreography

Published events:

- `order.created`
- `order.completed`
- `order.failed`

Consumed events:

- `inventory.reserved`
- `inventory.failed`
- `payment.success`
- `payment.failed`

Status lifecycle:

- `PENDING` -> `AWAITING_PAYMENT` when `inventory.reserved`.
- `PENDING`/`AWAITING_PAYMENT` -> `FAILED` when `inventory.failed`.
- `AWAITING_PAYMENT` -> `COMPLETED` when `payment.success`.
- `AWAITING_PAYMENT` -> `FAILED` when `payment.failed`.

All events follow envelope v1:

- `eventId`
- `eventType`
- `occurredAt`
- `producer`
- `correlationId`
- `version`
- `payload`

Consumer applies idempotency guard by `eventId`.

Retry + DLQ behavior:

- Retries event processing with delay sequence `5000ms`, `30000ms`, `120000ms`.
- Uses retry queue `dam.order-service.retry.v1` and DLQ `dam.order-service.dlq.v1`.
- Preserves `x-retry-count` and correlation metadata headers.

## Swagger URL

- Local: `http://localhost:3005/docs`
