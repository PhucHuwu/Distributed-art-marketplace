# RabbitMQ Broker Conventions

## Exchange naming

- Use topic exchange: `dam.domain.events.v1`
- Exchange type: `topic`
- Durable: `true`

## Routing key format

- Pattern: `<domain>.<action>`
- Examples:
  - `order.created`
  - `inventory.reserved`
  - `payment.failed`

## Queue naming

- Pattern: `dam.<service>.v1`
- Examples:
  - `dam.inventory-service.v1`
  - `dam.order-service.v1`
  - `dam.audit-log-service.v1`

## Retry queue naming

- Pattern: `dam.<service>.retry.v1`
- Use dead-letter exchange to return message to main queue after TTL.

## DLQ naming

- Pattern: `dam.<service>.dlq.v1`
- Pattern for DLX exchange: `dam.dlx.v1`

## Retry policy baseline

- Attempt 1: immediate process.
- Attempt 2: +5 seconds.
- Attempt 3: +30 seconds.
- Attempt 4: +120 seconds.
- After max attempts, route to DLQ.

## Headers and metadata

- Preserve original envelope fields.
- Add retry metadata headers:
  - `x-retry-count`
  - `x-first-failed-at`

## Consumer behavior requirements

- Manual acknowledgment mode.
- Idempotent processing by `eventId`.
- Structured logs include `eventId` and `correlationId`.
