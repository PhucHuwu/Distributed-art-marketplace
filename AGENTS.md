# AGENTS.md

## Purpose
This guide defines how coding agents should operate in this repository.
Prefer existing patterns and conventions over inventing new ones.

## Repository Overview
- Monorepo for a backend-first, event-driven distributed system.
- Key folders: `gateway/`, `infra/`, `services/`, `scripts/`, `frontend/`.
- Currently implemented service code is under `services/audit-log-service`.
- Runtime stack: Node.js + TypeScript + PostgreSQL + RabbitMQ + NGINX.

## Read These First
- `README.md`
- `SWAGGER_GUIDELINE.md`
- `infra/docs/MONOREPO_CONVENTION.md`
- `infra/docs/RUNTIME_CONVENTIONS.md`
- `infra/docs/SWAGGER_STANDARD.md`
- `infra/docs/EVENT_CONTRACT_V1.md`
- `infra/docs/BROKER_CONVENTIONS.md`
- `infra/docs/API_EVENT_NAMING.md`
- `infra/docs/INTEGRATION_CHECKLIST.md`

## Build / Lint / Test Commands

### Root commands (run at repo root)
- Install: `npm install`
- Lint: `npm run lint`
- Format check: `npm run format`
- Start local stack: `npm run compose:up`
- Stop local stack: `npm run compose:down`
- Smoke checks: `npm run smoke:local`

### Service commands (run in `services/audit-log-service`)
- Install: `npm install`
- Dev watch: `npm run dev`
- Start: `npm run start`
- Build: `npm run build`
- All tests: `npm run test`
- Prisma generate: `npm run prisma:generate`
- Prisma migrate: `npm run prisma:migrate`

### Running a single test (important)
- One file: `NODE_ENV=test npx tsx --test tests/process-event.test.ts`
- Another file: `NODE_ENV=test npx tsx --test tests/query.test.ts`
- By test name: `NODE_ENV=test npx tsx --test --test-name-pattern "duplicate event" tests/process-event.test.ts`

## Style and Formatting Rules

### Prettier (`.prettierrc`)
- `semi: true`
- `singleQuote: true`
- `tabWidth: 2`
- `trailingComma: all`
- `printWidth: 100`
- `arrowParens: always`
- `endOfLine: lf`

### EditorConfig (`.editorconfig`)
- UTF-8, LF, 2-space indentation.
- Insert final newline.
- Trim trailing whitespace (except markdown files).

### ESLint (`eslint.config.cjs`, `.eslintrc.json`)
- `no-unused-vars`: warn
- `no-console`: warn
- Keep lint clean; avoid adding disable comments unless necessary.

## Imports, Modules, and Project Structure
- Import order: external packages first, then internal modules.
- Keep single quotes and semicolons.
- Prefer relative imports within the same service.
- Keep files focused by concern (`config`, `lib`, `middlewares`, `routes`, `services`, `types`, `utils`).
- Follow existing folder conventions under `services/*`:
  - `src/`, `prisma/`, `tests/`, `.env.example`, `README.md`, `TASK.md`.

## Type Safety and TypeScript
- `services/audit-log-service/tsconfig.json` uses strict mode; keep strong typing.
- Prefer explicit return types for exported functions.
- Avoid `any`; use narrow unions, interfaces, and type aliases.
- Validate env config at startup; fail fast for missing required variables.
- Keep compatibility with current module target (`CommonJS`).

## Naming Conventions
- HTTP paths: lowercase + kebab-case.
- Resource paths should be plural where applicable.
- Required docs endpoints for services:
  - `GET /health`
  - `GET /docs`
  - `GET /openapi.json`
- Event type format: `<domain>.<action>` (e.g., `order.created`, `payment.failed`).
- Producer name: lowercase service folder name (e.g., `audit-log-service`).
- Code symbols:
  - variables/functions: `camelCase`
  - types/interfaces: `PascalCase`
  - true constants/env keys: uppercase snake case

## Error Handling and Logging
- Use structured error envelope for API failures:
  - `success: false`
  - `error: { code, message, details }`
  - include `correlationId` when present
- Use centralized middleware for unhandled errors.
- In route handlers, forward failures with `next(error)`.
- Prefer structured logs (`pino`), not ad-hoc `console.log`.
- Include trace fields like `correlationId` and `eventId` when available.

## Eventing and Broker Rules
- Enforce event envelope v1 fields:
  - `eventId`, `eventType`, `occurredAt`, `producer`, `correlationId`, `version`, `payload`
- Never place secrets/tokens/passwords in `payload`.
- Consumers must be idempotent by `eventId`.
- RabbitMQ naming conventions:
  - Exchange: `dam.domain.events.v1`
  - Routing key: `<domain>.<action>`
  - Queue: `dam.<service>.v1`
  - Retry/DLQ naming per `infra/docs/BROKER_CONVENTIONS.md`

## API and Swagger Expectations
- OpenAPI baseline should follow repo docs (`3.0.3` preferred).
- Document all implemented endpoints in `/docs` and `/openapi.json`.
- For protected routes, define bearer JWT security scheme.
- Keep API docs updated in the same change as behavior changes.

## Data Boundaries
- One PostgreSQL schema per service.
- No cross-service schema writes.
- Keep Prisma migrations inside the owning service.
- Add practical indexes for query-heavy paths.

## Hooks and Commit Pipeline
- Pre-commit hook runs `npx lint-staged`.
- Staged `*.{js,jsx,ts,tsx}` files run `eslint --fix` then `prettier --write`.
- Staged `*.{json,md,yml,yaml,html,css}` files run `prettier --write`.
- Expect hooks to modify staged files before commit completes.

## Repo-Specific Team Rules (.agents)
- Per `.agents/rules/rules.md`: communicate with developers in Vietnamese.
- Do not add emoji in source code.
- Commit messages should be professional English.
- Branching model documented as `main`, `develop`, and member branches (`phucth`, `anhlt`, `datlt`, `vubn`, `tuanhm`).
- Work in the correct owner branch/scope.

## Cursor / Copilot Rules Status
- `.cursor/rules/`: not found.
- `.cursorrules`: not found.
- `.github/copilot-instructions.md`: not found.

## Definition of Done for Agents
- Lint passes for changed scope.
- Formatting passes and line endings remain LF.
- Relevant tests pass (or explicitly state what was not run).
- Swagger/OpenAPI is updated when API surface changes.
- Event contracts are updated when event semantics change.
- No cross-service boundary violations introduced.
- Update docs (`README`, `TASK.md`, infra docs) when behavior changes.
