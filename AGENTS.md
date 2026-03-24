# AGENTS.md

Guide for agentic coding tools in this repository.

## 1) Repository Overview

- Project: `distributed-art-marketplace`
- Monorepo type: npm workspaces
- Root workspaces in `package.json`:
  - `frontend`
  - `services/*`
- Current state of code:
  - `frontend/` has `.gitkeep` only
  - `gateway/` has `.gitkeep` only
  - each folder in `services/` has `.gitkeep` and `TASKS.md`
  - root `docker-compose.yml` exists but is empty
- Consequence: app runtime/build/test pipelines are not scaffolded yet.

## 2) Rule Files and Priority

- Primary in-repo rules:
  - `.agents/rules/rules.md`
  - `.agents/workflows/gitflow.md`
- Checked Cursor/Copilot rule locations:
  - `.cursor/rules/` -> not found
  - `.cursorrules` -> not found
  - `.github/copilot-instructions.md` -> not found
- If these files appear later, treat them as authoritative and update this file.

## 3) Team Conventions from Existing Rules

- Communicate with maintainers in Vietnamese.
- Do not add emoji in source code.
- Commit messages should be professional English.
- Gitflow notes in repo docs:
  - long-lived branches: `main`, `develop`
  - member branches: `phucth`, `anhlt`, `datlt`, `vubn`, `tuanhm`

## 4) Hooks and Commit-Time Checks

- Husky pre-commit runs `npx lint-staged`.
- Staged `*.js,*.jsx,*.ts,*.tsx` run:
  - `eslint --fix`
  - `prettier --write`
- Staged `*.json,*.md` run:
  - `prettier --write`

## 5) Environment File Policy

- Repo rules explicitly allow committing `.env*` files.
- Do not add `.env*` ignore rules unless maintainers request policy changes.
- Still avoid exposing secrets outside repository collaboration channels.

## 6) Bootstrap Commands

- Run from root: `/Users/phuc/Coding/Git/Distributed-art-marketplace`
- Install dependencies:

```bash
npm install
```

- Install/refresh git hooks:

```bash
npm run prepare
```

## 7) Build / Lint / Test Commands

### 7.1 Implemented root scripts

```bash
npm run prepare
npm run format
npm run lint-staged
```

### 7.2 Commands that work now

- Format all supported files:

```bash
npm run format
```

- Run staged lint/format checks:

```bash
npm run lint-staged
```

- Run ESLint manually across JS/TS files:

```bash
npx eslint . --ext .js,.jsx,.ts,.tsx
```

### 7.3 Commands not available yet

- No root `build` script.
- No root `test` script.
- No service-level `package.json` scripts yet.

### 7.4 Single-test execution guidance (important)

- Current fact: no test runner is configured yet, so single-test execution is unavailable.
- Recommended pattern after service scaffolding:

```bash
npm run test --workspace services/<service-name> -- <path-to-test-file>
```

- Recommended test-name filtering pattern (Jest/Vitest style):

```bash
npm run test --workspace services/<service-name> -- <path-to-test-file> -t "<test name>"
```

## 8) Formatting and Lint Baseline

### Prettier (`.prettierrc`)

- `semi: true`
- `singleQuote: true`
- `tabWidth: 2`
- `trailingComma: all`
- `printWidth: 100`
- `arrowParens: always`
- `endOfLine: lf`

### EditorConfig (`.editorconfig`)

- UTF-8 charset
- LF line endings
- spaces, indent size 2
- final newline required
- trim trailing whitespace (except Markdown)

### ESLint (`.eslintrc.json`)

- extends: `eslint:recommended`, `prettier`
- `no-unused-vars`: `warn`
- `no-console`: `warn`
- ignore: `node_modules/`, `dist/`, `build/`, `.next/`, `out/`

## 9) Code Style Guidelines for New Code

- Imports order: built-in -> external -> internal -> relative.
- Keep one blank line between import groups.
- Prefer named exports for shared modules.
- Prefer TypeScript unless maintainers request JavaScript.
- Avoid `any`; if unavoidable, keep scope narrow and justify usage.
- Define explicit DTO/event payload types at boundaries.
- Validate env values, HTTP input, and event payloads before business logic.
- Naming conventions:
  - files/folders: kebab-case
  - variables/functions: camelCase
  - interfaces/types/classes: PascalCase
  - constants/env keys: UPPER_SNAKE_CASE
  - events: dot notation past facts (example: `order.created`)
- Error handling:
  - use `code`, `message`, optional `details`
  - do not leak stack traces or secrets in responses
  - fail fast for missing required environment variables
  - keep consumers idempotent with stable IDs (`eventId`)
- Logging and architecture:
  - prefer structured logs with correlation IDs (`requestId`, `orderId`, `userId`)
  - mask tokens/secrets/signatures in logs
  - keep handlers thin; move logic to service/domain layer
  - isolate DB/MQ/external calls behind adapters/repositories
  - include `GET /health` endpoint for each service

## 10) Agent Pre-PR Checklist

- verify branch alignment with documented gitflow
- run `npm run format` or at least `npm run lint-staged`
- ensure Husky pre-commit checks pass
- keep commit messages professional English and emoji-free
- update this file when real build/test scripts are introduced
