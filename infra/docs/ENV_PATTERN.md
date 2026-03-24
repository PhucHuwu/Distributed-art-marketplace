# Environment File Pattern

## Root template

- File: `.env.example`
- Purpose: shared local environment values for docker-compose and service wiring.

## Service template

Each service must contain its own `.env.example` with at least:

```env
SERVICE_PORT=3000
DB_URL=postgresql://postgres:postgres@postgres:5432/distributed_art_marketplace?schema=service_schema
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
JWT_SECRET=replace_with_shared_local_secret
```

## Naming rules

- Keep variable keys uppercase snake case.
- Reuse shared names for cross-service consistency.
- Do not invent service-specific aliases for the same meaning.

## Local setup steps

1. Copy root template:

```bash
cp .env.example .env
```

2. Copy service template:

```bash
cp services/<service-name>/.env.example services/<service-name>/.env
```

3. Fill service-specific values when needed.
