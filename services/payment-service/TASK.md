# SVC-05 Payment Service Task

- Owner: `vubn`
- Branch: `vubn`
- Service path: `services/payment-service`

## Scope

- Implement `POST /payments`, `GET /payments/{id}`.
- Implement payment state transitions: `INITIATED -> PROCESSING -> SUCCESS/FAILED`.
- Publish `payment.success` and `payment.failed` events.
- Add webhook endpoint stub `POST /payments/webhook/{provider}`.
- Create Prisma schema and migration for schema `payments`.

## Micro Tasks (do in order)

- [ ] P1 - Initialize service structure and config validation.
- [ ] P2 - Setup Prisma datasource for schema `payments`.
- [ ] P3 - Create `payments` model and first migration.
- [ ] P4 - Implement `POST /payments` (create INITIATED transaction).
- [ ] P5 - Implement transition to `PROCESSING` in processing flow.
- [ ] P6 - Implement transition to `SUCCESS` and publish `payment.success`.
- [ ] P7 - Implement transition to `FAILED` and publish `payment.failed`.
- [ ] P8 - Validate state transition rules to avoid invalid jumps.
- [ ] P9 - Implement `GET /payments/{id}`.
- [ ] P10 - Add webhook stub `POST /payments/webhook/{provider}`.
- [ ] P11 - Add event producer abstraction and retry publishing strategy.
- [ ] P12 - Add `GET /health` endpoint.
- [ ] P13 - Integrate OpenAPI spec generation for payment endpoints.
- [ ] P14 - Expose Swagger UI route for API testing.
- [ ] P15 - Add structured logging with `correlationId`.
- [ ] P16 - Add API test cases for create/get/success/failed transitions.
- [ ] P17 - Update service README with run, env, events, endpoints, and Swagger URL.

## Acceptance Criteria

- Status transition validation is enforced.
- Event publishing for success/failure is reliable.
- Payment logs support traceability by `correlationId`.
- Swagger UI is available and documents all payment APIs.
- Service has healthcheck endpoint and structured logs with `correlationId`.

## Mandatory System Notes

- No sensitive secret/token exposure in logs/events.
- Event consumers/producers follow shared contract versioning.
- Build with extensibility for future payment providers.
- Swagger reference: follow `SWAGGER_GUIDELINE.md`.
