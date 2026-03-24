# Auth Service

Auth service manages credential registration, login, and JWT verification.

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
- `JWT_EXPIRES_IN`
- `BCRYPT_ROUNDS`

## Run locally

```bash
npm install
npm run dev
```

## Endpoints

- `GET /health`
- `GET /openapi.json`
- `GET /docs`
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/verify`
- `POST /auth/refresh` (stub `501` for MVP skeleton)

## Security notes

- Passwords are hashed with bcrypt.
- Raw passwords are never stored.
- JWT is signed by `JWT_SECRET`.

## Swagger URL

- Local: `http://localhost:3001/docs`
