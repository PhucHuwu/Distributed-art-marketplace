# OpenAPI and Swagger Standard

This file is the root reference used by all backend service owners.

## Required routes

- `GET /docs`
- `GET /openapi.json`
- `GET /health`

## OpenAPI baseline

- `openapi`: `3.0.3`
- `info.title`: `<Service Name> API`
- `info.version`: `v1`
- `servers`: local service URL
- `tags`: grouped by service domain

## Security scheme

For protected APIs, services must define Bearer JWT:

```json
{
  "type": "http",
  "scheme": "bearer",
  "bearerFormat": "JWT"
}
```

## Response envelope recommendation

Success:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": []
  },
  "correlationId": "uuid"
}
```

## Service-owner deliverable checklist

- Swagger UI is available.
- OpenAPI JSON is valid.
- All implemented endpoints are documented.
- Main error statuses are documented.
- Event publish/consume behavior is documented.

Full guideline source: `SWAGGER_GUIDELINE.md`.
