# SVC-02 User Profile Service Task

- Owner: `anhlt`
- Branch: `anhlt`
- Service path: `services/user-profile-service`

## Scope

- Implement `GET /users/me`, `PUT /users/me`.
- Implement address APIs: list/create/update/delete.
- Support default shipping address behavior.
- Create Prisma schema and migration for schema `users`.

## Micro Tasks (do in order)

- [ ] U1 - Initialize service structure and config validation.
- [ ] U2 - Setup Prisma datasource for schema `users`.
- [ ] U3 - Create `user_profiles` and `user_addresses` models + migration.
- [ ] U4 - Implement auth middleware to extract JWT identity.
- [ ] U5 - Implement `GET /users/me`.
- [ ] U6 - Implement `PUT /users/me` with input validation.
- [ ] U7 - Implement `GET /users/me/addresses`.
- [ ] U8 - Implement `POST /users/me/addresses`.
- [ ] U9 - Implement `PUT /users/me/addresses/{id}`.
- [ ] U10 - Implement `DELETE /users/me/addresses/{id}`.
- [ ] U11 - Enforce one-default-address rule per user.
- [ ] U12 - Add `GET /health` endpoint.
- [ ] U13 - Integrate OpenAPI spec generation for user profile endpoints.
- [ ] U14 - Expose Swagger UI route for API testing.
- [ ] U15 - Add structured logging with `correlationId`.
- [ ] U16 - Add API test cases for profile and address CRUD.
- [ ] U17 - Update service README with run, env, endpoint list, and Swagger URL.

## Acceptance Criteria

- Profile and address CRUD work with validation.
- Only one default address per user.
- API is protected by JWT identity.
- Swagger UI is available and documents all user profile APIs.
- Service has healthcheck endpoint and structured logs with `correlationId`.

## Mandatory System Notes

- Keep user profile data separated from auth credentials.
- Follow shared event contract if publishing/consuming events.
- Do not access other service schemas directly.
- Swagger reference: follow `SWAGGER_GUIDELINE.md`.
