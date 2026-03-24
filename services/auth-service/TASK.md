# SVC-01 Auth Service Task

- Owner: `anhlt`
- Branch: `anhlt`
- Service path: `services/auth-service`

## Scope

- Implement `POST /auth/register`, `POST /auth/login`, `GET /auth/verify`.
- Hash password with bcrypt/argon2, never store plain password.
- Issue and verify JWT.
- Prepare refresh token flow if included in MVP.
- Create Prisma schema and migration for schema `auth`.

## Micro Tasks (do in order)

- [x] A1 - Initialize service structure (src, config, routes, controllers, services, prisma).
- [x] A2 - Setup env loader and base config validation.
- [x] A3 - Setup Prisma datasource for schema `auth`.
- [x] A4 - Create `credentials` model and first migration.
- [x] A5 - Implement password hash utility (bcrypt/argon2) and unit test.
- [x] A6 - Implement `POST /auth/register` with validation and duplicate email handling.
- [x] A7 - Implement `POST /auth/login` with credential verification.
- [x] A8 - Implement JWT issue helper and token expiry config.
- [x] A9 - Implement `GET /auth/verify` middleware + endpoint.
- [x] A10 - Add refresh token skeleton (model + route stub) if MVP+.
- [x] A11 - Add `GET /health` endpoint.
- [x] A12 - Integrate OpenAPI spec generation for auth endpoints.
- [x] A13 - Expose Swagger UI route for API testing.
- [x] A14 - Add structured logging with `correlationId`.
- [x] A15 - Add API test cases: success, invalid password, user not found, invalid token.
- [x] A16 - Update service README with run, env, endpoint list, and Swagger URL.

## Acceptance Criteria

- Register/login/verify works for happy path and invalid credential path.
- Password is always hashed.
- Auth logs/events do not expose raw secret/token/password.
- Swagger UI is available and documents all public auth APIs.
- Service has healthcheck endpoint and structured logs with `correlationId`.

## Mandatory System Notes

- Stack: Node.js + PostgreSQL + Prisma + RabbitMQ + JWT.
- DB rule: shared PostgreSQL instance but isolated schema per service.
- Event rule: idempotent consumer by `eventId`, retry/backoff, DLQ-ready.
- Swagger reference: follow `SWAGGER_GUIDELINE.md`.
