# SVC-08 Audit Log Service Task

- Owner: `phucth`
- Branch: `phucth`
- Service path: `services/audit-log-service`

## Scope

- Consume all major system events as central audit consumer.
- Persist normalized event logs into schema `audit_logs`.
- Implement admin query APIs by user, order, service, eventType, and time range.
- Ensure high traceability with `eventId` and `correlationId`.

## Micro Tasks (do in order)

- [ ] L1 - Initialize service structure and config validation.
- [ ] L2 - Setup Prisma datasource for schema `audit_logs`.
- [ ] L3 - Create `event_logs` model and migration.
- [ ] L4 - Implement RabbitMQ consumer bootstrap for multi-event subscription.
- [ ] L5 - Subscribe to core events (`order.*`, `inventory.*`, `payment.*`).
- [ ] L6 - Implement event normalization mapper before persistence.
- [ ] L7 - Implement idempotency guard by `eventId`.
- [ ] L8 - Persist logs with `correlationId`, service, aggregate fields.
- [ ] L9 - Add index strategy for user/order/eventType/time filters.
- [ ] L10 - Implement `GET /admin/audit-logs` with query filters.
- [ ] L11 - Implement `GET /admin/audit-logs/{eventId}`.
- [ ] L12 - Add admin authorization middleware for audit APIs.
- [ ] L13 - Add `GET /health` endpoint.
- [ ] L14 - Integrate OpenAPI spec generation for admin audit endpoints.
- [ ] L15 - Expose Swagger UI route for API testing.
- [ ] L16 - Add structured logging with `correlationId`.
- [ ] L17 - Add tests for consume, deduplicate, and query filters.
- [ ] L18 - Update service README with run, env, subscribed events, endpoints, and Swagger URL.

## Acceptance Criteria

- Core business events are stored and queryable.
- Queries can support incident investigation flow.
- Consumer is idempotent and avoids duplicate log writes.
- Swagger UI is available and documents all admin audit APIs.
- Service has healthcheck endpoint and structured logs with `correlationId`.

## Mandatory System Notes

- Audit service is for observability and governance, not business decision source.
- Event payload should be stored safely without leaking secrets.
- Keep schema and indexes practical for query performance.
- Swagger reference: follow `SWAGGER_GUIDELINE.md`.
