# Local Boot Test Report

## Context

- Date: 2026-03-24
- Scope: ROOT-01 baseline stack boot verification

## Commands executed

```bash
cp .env.example .env
docker compose up -d --build
```

## Result

- Status: blocked by local environment dependency.
- Error: Docker daemon is not running on executor machine.
- Message:
  - `failed to connect to the docker API at unix:///var/run/docker.sock`

## Impact

- Could not complete full local boot and full smoke runtime verification in this environment.

## Recommended action on developer machine

1. Start Docker Desktop or docker daemon.
2. Run `docker compose up -d --build` from repo root.
3. Run `bash scripts/smoke-local.sh`.
4. Capture service logs for any failing endpoint:

```bash
docker compose logs <service-name>
```

## Notes

- Root configs and smoke script are prepared and ready for execution once Docker is available.
