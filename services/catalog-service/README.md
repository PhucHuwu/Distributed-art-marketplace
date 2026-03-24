# Catalog Service

Read-heavy service for artwork catalog browsing and admin catalog management.

## Environment

Copy template and update values:

```bash
cp .env.example .env
```

Required keys:

- `SERVICE_PORT`
- `DB_URL`
- `RABBITMQ_URL`
- `JWT_SECRET`
- `SERVICE_NAME`

## Run locally

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

## Endpoints

- `GET /health`
- `GET /openapi.json`
- `GET /docs`
- `GET /catalog/artworks`
- `GET /catalog/artworks/:idOrSlug`
- `GET /catalog/artists`
- `POST /catalog/artworks` (Admin)
- `PUT /catalog/artworks/:id` (Admin)

## Filtering and search

`GET /catalog/artworks` supports:

- `page`, `limit`
- `artist` (id, slug, or exact name)
- `category` (id, slug, or exact name)
- `minPrice`, `maxPrice`
- `q` (title/slug/artist name)

## Swagger URL

- Local: `http://localhost:3003/docs`
