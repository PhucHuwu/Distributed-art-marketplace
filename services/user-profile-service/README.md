# User Profile Service

User profile service manages current user profile data and shipping addresses.

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
npm run dev
```

## Endpoints

- `GET /health`
- `GET /openapi.json`
- `GET /docs`
- `GET /users/me`
- `PUT /users/me`
- `GET /users/me/addresses`
- `POST /users/me/addresses`
- `PUT /users/me/addresses/:id`
- `DELETE /users/me/addresses/:id`

## Business rule

- Each user has at most one default address.
- If the default address is deleted, the oldest remaining address becomes default.

## Swagger URL

- Local: `http://localhost:3002/docs`
