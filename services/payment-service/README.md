# Payment Service

Handles payment transaction lifecycle and emits payment domain events.

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

Optional keys:

- `RABBITMQ_MAX_PUBLISH_RETRY` (default: `4`)
- `RABBITMQ_PUBLISH_RETRY_DELAY_MS` (default: `1000`)

## Run locally

```bash
npm install
npm run prisma:generate
npm run dev
```

## Endpoints

- `GET /health`
- `GET /openapi.json`
- `GET /docs`
- `POST /payments`
- `GET /payments/:id`
- `POST /payments/webhook/:provider`

## Payment states

- `INITIATED -> PROCESSING -> SUCCESS | FAILED`

Invalid transitions are rejected.

## Published events

- `payment.success`
- `payment.failed`

Envelope follows contract v1:

- `eventId`
- `eventType`
- `occurredAt`
- `producer`
- `correlationId`
- `version`
- `payload`

## Swagger URL

- Local: `http://localhost:3006/docs`
