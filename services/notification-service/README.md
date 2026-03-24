# Notification Service

Consumes business failure/completion events and sends email/SMS notifications via provider abstraction.

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

Optional keys:

- `RABBITMQ_ROUTING_KEYS` (default: `order.completed,order.failed,payment.failed`)
- `RABBITMQ_MAX_RETRY` (default: `4`)
- `RABBITMQ_RETRY_BACKOFF_MS` (default: `5000,30000,120000`)
- `RABBITMQ_DLX` (default: `dam.dlx.v1`)
- `RABBITMQ_DLQ` (default: `dam.notification-service.dlq.v1`)

## Run locally

```bash
npm install
npm run dev
```

## Endpoints

- `GET /health`
- `GET /openapi.json`
- `GET /docs`
- `GET /notifications/stats`
- `POST /notifications/debug/emit`

## Event subscriptions

- `order.completed`
- `order.failed`
- `payment.failed`

## Delivery behavior

- Channel abstraction: email sender and SMS sender.
- Mock providers are used in MVP.
- Retry/backoff baseline is configurable through env.
- Duplicate events are skipped by idempotency guard (`eventId`).
- Failed events are routed to DLQ-ready path.

## Swagger URL

- Local: `http://localhost:3007/docs`
