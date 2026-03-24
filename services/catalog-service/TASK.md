# SVC-03 Catalog Service Task

- Owner: `datlt`
- Branch: `datlt`
- Service path: `services/catalog-service`

## Scope

- Implement public APIs for artwork list/detail.
- Implement admin CRUD for artworks/artists/categories.
- Support filter/search by artist, price range, category.
- Create Prisma schema and migration for schema `catalog`.

## Micro Tasks (do in order)

- [ ] C1 - Initialize service structure and config validation.
- [ ] C2 - Setup Prisma datasource for schema `catalog`.
- [ ] C3 - Create models: `artists`, `artworks`, `artwork_images`, `categories`, `artwork_categories`.
- [ ] C4 - Create first migration and seed sample data for local testing.
- [ ] C5 - Implement `GET /catalog/artworks` with pagination.
- [ ] C6 - Add filters: artist, category, min/max price.
- [ ] C7 - Implement keyword search on title/artist.
- [ ] C8 - Implement `GET /catalog/artworks/{idOrSlug}`.
- [ ] C9 - Implement `GET /catalog/artists`.
- [ ] C10 - Implement admin `POST /catalog/artworks`.
- [ ] C11 - Implement admin `PUT /catalog/artworks/{id}`.
- [ ] C12 - Add basic admin auth guard for write APIs.
- [ ] C13 - Add `GET /health` endpoint.
- [ ] C14 - Integrate OpenAPI spec generation for catalog endpoints.
- [ ] C15 - Expose Swagger UI route for API testing.
- [ ] C16 - Add structured logging with `correlationId`.
- [ ] C17 - Add API test cases for list/detail/filter/admin writes.
- [ ] C18 - Update service README with run, env, endpoint list, and Swagger URL.

## Acceptance Criteria

- Public APIs return stable pagination/filter shape.
- Admin write APIs enforce authorization.
- Service is optimized for read-heavy traffic basics.
- Swagger UI is available and documents all catalog APIs.
- Service has healthcheck endpoint and structured logs with `correlationId`.

## Mandatory System Notes

- Keep SEO-friendly/read-heavy usage in mind.
- Do not couple catalog write flow to other services.
- Respect shared API/event naming conventions.
- Swagger reference: follow `SWAGGER_GUIDELINE.md`.
