# ROOT-01 Leader Task (Detailed)

- Owner: `phucth`
- Branch: `phucth`
- Scope: root-level architecture and integration foundation

## Micro Tasks (do in order)

- [ ] R1 - Define final monorepo folder convention and update root docs.
- [ ] R2 - Create base `docker-compose.yml` services for PostgreSQL and RabbitMQ.
- [ ] R3 - Add gateway container wiring and upstream placeholders for 8 services.
- [ ] R4 - Define common env variable naming (`SERVICE_PORT`, `DB_URL`, `RABBITMQ_URL`, `JWT_SECRET`).
- [ ] R5 - Create `.env.example` files pattern and root setup instructions.
- [ ] R6 - Define healthcheck convention (`GET /health`) and expected response shape.
- [ ] R7 - Publish event envelope v1 contract (`eventId`, `eventType`, `occurredAt`, `producer`, `correlationId`, `version`, `payload`).
- [ ] R8 - Define message broker conventions (exchange/topic naming, retry, DLQ naming).
- [ ] R9 - Define cross-service API/event naming convention doc.
- [ ] R10 - Define OpenAPI/Swagger standard for all backend services (route path, auth scheme, tags, response format).
- [ ] R11 - Ensure each service task includes Swagger UI and OpenAPI JSON deliverable.
- [ ] R12 - Build local smoke test script/checklist for startup verification.
- [ ] R13 - Run full local boot test and collect run issues.
- [ ] R14 - Publish integration checklist for all service owners before PR phase.

## Acceptance Criteria

- Team can run base stack locally with one command sequence.
- Shared conventions are documented and referenced by service tasks.
- Swagger convention is shared and adopted by all services.
- Smoke flow for core event-driven ordering can be validated.

## Mandatory System Notes

- Keep schema isolation per service on shared PostgreSQL instance.
- Event synchronization must follow RabbitMQ Pub/Sub choreography.
- Cross-service DB access is not allowed.
- Swagger standard reference: `SWAGGER_GUIDELINE.md`.
