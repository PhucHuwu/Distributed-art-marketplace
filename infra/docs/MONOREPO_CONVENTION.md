# Monorepo Folder Convention

## Purpose

This document defines the final root folder convention for the backend phase.

## Root layout

- `gateway/`: NGINX routing and reverse proxy configuration.
- `infra/`: infrastructure assets and shared technical conventions.
- `services/`: one folder per backend microservice.
- `frontend/`: reserved placeholder for later Next.js phase.
- `scripts/`: local automation scripts, smoke tests, and helper commands.

## Services layout standard

Each service under `services/*` should follow:

- `src/`: application source code.
- `prisma/`: schema and migrations for the service schema only.
- `tests/`: unit and integration tests.
- `.env.example`: environment template for the service.
- `README.md`: service runbook.
- `TASK.md`: assigned task breakdown.

## Ownership and edit boundaries

- Service owner edits only files under their service folder.
- Root owner (`phucth`) maintains root/shared files:
  - `docker-compose.yml`
  - `gateway/*`
  - `infra/docs/*`
  - root env patterns and integration runbooks

## Mandatory technical boundaries

- Shared PostgreSQL instance, isolated schema per service.
- No cross-service schema writes.
- Event synchronization must use RabbitMQ Pub/Sub choreography.
