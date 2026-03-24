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

- [x] C1 - Initialize service structure and config validation.
- [x] C2 - Setup Prisma datasource for schema `catalog`.
- [x] C3 - Create models: `artists`, `artworks`, `artwork_images`, `categories`, `artwork_categories`.
- [x] C4 - Create first migration and seed sample data for local testing.
- [x] C5 - Implement `GET /catalog/artworks` with pagination.
- [x] C6 - Add filters: artist, category, min/max price.
- [x] C7 - Implement keyword search on title/artist.
- [x] C8 - Implement `GET /catalog/artworks/{idOrSlug}`.
- [x] C9 - Implement `GET /catalog/artists`.
- [x] C10 - Implement admin `POST /catalog/artworks`.
- [x] C11 - Implement admin `PUT /catalog/artworks/{id}`.
- [x] C12 - Add basic admin auth guard for write APIs.
- [x] C13 - Add `GET /health` endpoint.
- [x] C14 - Integrate OpenAPI spec generation for catalog endpoints.
- [x] C15 - Expose Swagger UI route for API testing.
- [x] C16 - Add structured logging with `correlationId`.
- [x] C17 - Add API test cases for list/detail/filter/admin writes.
- [x] C18 - Update service README with run, env, endpoint list, and Swagger URL.

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
