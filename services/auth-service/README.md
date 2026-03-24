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

Optional local-dev keys:

- `AUTO_SEED_ADMIN` (default: `true`)
- `ADMIN_SEED_EMAIL` (default: `admin@local.dev`)
- `ADMIN_SEED_PASSWORD` (default: `Admin@123456`)

## Run locally

```bash
npm install
npm run prisma:migrate
npm run dev
```

Admin seed for local development:

- When `AUTO_SEED_ADMIN=true` and `NODE_ENV` is not `production`, service startup ensures one admin credential.
- You can also run `npm run prisma:seed` manually.

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
