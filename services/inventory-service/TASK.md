# SVC-04 Inventory Service Task

- Owner: `datlt`
- Branch: `datlt`
- Service path: `services/inventory-service`

## Scope

- Implement `POST /inventory/reserve`, `POST /inventory/release`, `POST /inventory/adjust`, `GET /inventory/{artworkId}`.
- Consume `order.created` event.
- Publish `inventory.reserved` or `inventory.failed`.
- Enforce stock rule `on_hand_qty - reserved_qty >= 0`.
- Create Prisma schema and migration for schema `inventory`.

## Micro Tasks (do in order)

- [ ] I1 - Initialize service structure and config validation.
- [ ] I2 - Setup Prisma datasource for schema `inventory`.
- [ ] I3 - Create models: `stock_items`, `stock_reservations` + migration.
- [ ] I4 - Implement stock repository with transaction support.
- [ ] I5 - Implement `GET /inventory/{artworkId}`.
- [ ] I6 - Implement `POST /inventory/adjust` (admin/internal).
- [ ] I7 - Implement `POST /inventory/reserve` with concurrency-safe logic.
- [ ] I8 - Implement `POST /inventory/release` with reservation status handling.
- [ ] I9 - Consume `order.created` event.
- [ ] I10 - Add idempotency check by `eventId` for consumer.
- [ ] I11 - Publish `inventory.reserved` and `inventory.failed` events.
- [ ] I12 - Add retry/backoff and DLQ-ready consume strategy.
- [ ] I13 - Add `GET /health` endpoint.
- [ ] I14 - Integrate OpenAPI spec generation for inventory endpoints.
- [ ] I15 - Expose Swagger UI route for API testing.
- [ ] I16 - Add structured logging with `correlationId`.
- [ ] I17 - Add tests for reserve success, reserve fail, duplicate event, release flow.
- [ ] I18 - Update service README with run, env, events, endpoints, and Swagger URL.

## Acceptance Criteria

- Reserve/release logic is safe under concurrent requests.
- Event handling is idempotent by `eventId`.
- Publish correct event by business result.
- Swagger UI is available and documents all inventory APIs.
- Service has healthcheck endpoint and structured logs with `correlationId`.

## Mandatory System Notes

- This is write-heavy domain; prioritize consistency.
- Keep event payload free of sensitive data.
- Implement retry/backoff and DLQ-ready processing.
- Swagger reference: follow `SWAGGER_GUIDELINE.md`.
