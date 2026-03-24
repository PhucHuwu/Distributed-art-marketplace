# SVC-06 Notification Service Task

- Owner: `vubn`
- Branch: `vubn`
- Service path: `services/notification-service`

## Scope

- Consume `order.completed`, `order.failed`, `payment.failed` events.
- Send email/SMS via provider abstraction (mock provider for MVP).
- Implement retry/backoff for temporary failures.
- Add failure logging and DLQ-ready behavior.

## Micro Tasks (do in order)

- [ ] N1 - Initialize service structure and config validation.
- [ ] N2 - Implement event consumer bootstrap for RabbitMQ.
- [ ] N3 - Subscribe to `order.completed`.
- [ ] N4 - Subscribe to `order.failed`.
- [ ] N5 - Subscribe to `payment.failed`.
- [ ] N6 - Build notification payload mapper per event type.
- [ ] N7 - Implement email sender abstraction + mock provider.
- [ ] N8 - Implement SMS sender abstraction + mock provider.
- [ ] N9 - Implement idempotency guard to avoid duplicate sends.
- [ ] N10 - Implement retry/backoff for transient errors.
- [ ] N11 - Add failure handling and DLQ-ready processing.
- [ ] N12 - Add `GET /health` endpoint.
- [ ] N13 - Integrate OpenAPI spec generation for available internal/debug endpoints.
- [ ] N14 - Expose Swagger UI route for API testing.
- [ ] N15 - Add structured logging with `correlationId`.
- [ ] N16 - Add tests for consume success, duplicate event, transient failure retry.
- [ ] N17 - Update service README with run, env, subscribed events, and Swagger URL.

## Acceptance Criteria

- Notifications are triggered for required events.
- Retry mechanism works for transient delivery failures.
- Failed notifications are traceable with `correlationId`.
- Swagger UI is available for internal/debug APIs and documents event contracts.
- Service has healthcheck endpoint and structured logs with `correlationId`.

## Mandatory System Notes

- Notification service can run without dedicated DB in MVP.
- Keep payload minimal and avoid sensitive data.
- Ensure idempotent consume behavior to avoid duplicate sends.
- Swagger reference: follow `SWAGGER_GUIDELINE.md`.
