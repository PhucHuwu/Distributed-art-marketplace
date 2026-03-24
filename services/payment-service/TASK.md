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

- [x] P1 - Initialize service structure and config validation.
- [x] P2 - Setup Prisma datasource for schema `payments`.
- [x] P3 - Create `payments` model and first migration.
- [x] P4 - Implement `POST /payments` (create INITIATED transaction).
- [x] P5 - Implement transition to `PROCESSING` in processing flow.
- [x] P6 - Implement transition to `SUCCESS` and publish `payment.success`.
- [x] P7 - Implement transition to `FAILED` and publish `payment.failed`.
- [x] P8 - Validate state transition rules to avoid invalid jumps.
- [x] P9 - Implement `GET /payments/{id}`.
- [x] P10 - Add webhook stub `POST /payments/webhook/{provider}`.
- [x] P11 - Add event producer abstraction and retry publishing strategy.
- [x] P12 - Add `GET /health` endpoint.
- [x] P13 - Integrate OpenAPI spec generation for payment endpoints.
- [x] P14 - Expose Swagger UI route for API testing.
- [x] P15 - Add structured logging with `correlationId`.
- [x] P16 - Add API test cases for create/get/success/failed transitions.
- [x] P17 - Update service README with run, env, events, endpoints, and Swagger URL.

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
