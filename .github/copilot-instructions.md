# Project Guidelines

Pour tout ajout de fonctionnalité ou correction de bug, lis et applique
[.github/skills/test-driven-development/SKILL.md](skills/test-driven-development/SKILL.md)
avant de modifier le code de l'application. Écris et exécute les tests d'abord,
présente-les, puis attends leur validation explicite avant l'implémentation.
Cette règle ne concerne pas les demandes d'explication ou de documentation seules.

## Build and Test

Use Node.js 22.14 or newer. Install the locked dependencies from the repository root:

```bash
npm ci
npm run setup
```

The main commands are run from the repository root:

```bash
npm run dev        # backend on :3000 and frontend on :5173
npm run lint       # Oxlint in both workspaces; warnings are errors
npm run typecheck  # TypeScript checks in both workspaces
npm run test       # Vitest in both workspaces
npm run build      # backend and frontend production builds
npm run check      # lint, typecheck, tests, then build
```

Workspace-specific commands are available when a change is isolated to one side:

```bash
npm run lint -w backend
npm run typecheck -w backend
npm run test -w backend
npm run lint -w frontend
npm run typecheck -w frontend
npm run test -w frontend
```

Run one test file or test name by forwarding Vitest arguments:

```bash
npm run test -w backend -- tests/offers.test.ts
npm run test -w frontend -- tests/OffersPage.test.tsx
npm run test -w backend -- -t "name or pattern"
npm run test -w frontend -- -t "name or pattern"
```

The backend build runs `tsc -p tsconfig.build.json` and copies migrations to `dist`;
the frontend build runs `tsc -b` followed by `vite build`. Use `npm run db:init` to
apply migrations and seed an empty database. Use `npm run db:reset` only when the
development server is stopped.

## Architecture

This is an npm-workspaces monorepo with an Express/TypeScript backend and a
React/Vite/TypeScript frontend. The local database is SQLite through
`better-sqlite3`.

Backend request flow:

```text
main.ts -> app.ts -> authentication/authorization/error middleware
         -> controllers -> services -> repositories -> SQLite
                                      -> mappers -> API DTOs
```

- `main.ts` loads configuration, initializes the database, and starts the server.
- `app.ts` assembles the application and its dependency-injected repositories and services.
- Controllers own HTTP parsing, validation, status codes, and response formatting.
- Services contain business rules and must not receive Express `Request` or `Response`.
- Repositories contain handwritten SQL and return database rows (DBOs).
- Mappers convert between database rows, domain objects, and API DTOs.
- `authenticate` reloads the user, roles, and companies from the database for each request;
  `authorize` applies named permission rules; `errorHandler` normalizes failures.

Frontend flow follows the documented MVVM structure:

```text
pages -> hooks -> services/utils -> models
  \-> reusable components
```

- `App.tsx` calls `useAuth` once and passes the session and logout behavior to pages.
- Services call the API through `readJson`: check the HTTP status before parsing JSON,
  then validate the response with a hand-written type guard.
- Hooks expose display-ready state, own asynchronous actions, and handle unauthorized
  responses. Keep a stable `onUnauthorized` callback and ignore results from previous
  sessions or aborted requests. See `useOfferApplication` for application submission.
- Pages assemble route-level UI; reusable components do not know about routes.
- Vite proxies `/api/...` to the backend and removes the `/api` prefix.

Read [docs/architecture.md](../docs/architecture.md) for the complete layer map and
reference implementations. Read [backend/API.md](../backend/API.md) before changing
routes or response/error shapes.

## Conventions

- Backend relative imports include the `.ts` extension; TypeScript rewrites them to `.js`
  during the build. Frontend imports follow Vite's TypeScript configuration.
- Keep strict TypeScript settings intact (`noUncheckedIndexedAccess`, unused-code checks,
  consistent casing, and `verbatimModuleSyntax`). Do not introduce `any`; Oxlint rejects it.
- Backend errors are raised as `throw new HttpError(status, code, message)` and are returned
  as `{ "error": { "code", "message" } }` by the central error handler.
- Authentication tokens are sent as the raw value in `Authorization`, without a `Bearer`
  prefix. Authorization must be enforced by backend middleware/services, not only by hiding
  controls in the frontend.
- Backend statuses and enum-like values use English codes (for example `PUBLISHED`);
  frontend utilities map them to French labels for display.
- Add a new numbered SQL migration under `backend/src/db/migrations/` for every schema
  change. Never edit an already-applied migration.
- Backend tests use Vitest and Supertest with an in-memory SQLite database and seed helpers;
  they must not use the development database. Frontend tests use Vitest, jsdom, and
  Testing Library with mocked API responses from `frontend/tests/helpers/fetchMock.ts`.
- Keep API documentation and REST Client examples in sync when changing an endpoint:
  update `backend/API.md` and the relevant files under `backend/http/`.
- Follow the existing dependency-factory pattern (`create...Repository`,
  `create...Service`) when adding backend layers so complete applications remain easy to
  assemble in tests.
- The API port is configured with `API_PORT`, not `PORT`. Demo authentication is controlled
  by `DEMO_AUTH_ENABLED` and must not be enabled in production.

## Review and functional verification

- Use React form `onSubmit`, associate each input with a label, retain HTML validation,
  and show loading and error states. Server validation remains mandatory.
- Verify ownership on the backend: for example, withdrawing another student's
  application must return 403 and leave the owner's data unchanged.
- Test assertions must prove the business outcome, not only the HTTP status.
  After creation, reread the persisted record; after refusal, verify no unwanted change.
- Distinguish automated tests, browser checks by the agent, and the student's own
  observations in reports. Never invent a conversation, manual result, or past TDD cycle.
- `.github/workflows/check.yml` runs the existing checks on pushes and pull requests.
  A local success does not establish that the remote workflow has run successfully.

## Browser verification and evidence

- Run `npm run test:e2e` separately from `npm run check`. The E2E suite uses
  Chromium, real local servers, and only `backend/data/e2e.db`; never reset the
  development database for tests. Stop and report a port conflict rather than
  killing an unrelated server or silently reusing it.
- `.mcp.json` configures Playwright MCP over local HTTP. Playwright Test scripts
  are a separate mechanism and must run without the MCP server.
- New tests for existing behavior do not establish historical TDD. Never delete
  validated application code or invent an earlier failing run to claim that order.
- Preserve authentic conversation exports. Record dated student declarations
  separately from logs and agent observations. A missing result is not a pass.
- Do not add an Ubuntu workflow or E2E CI implicitly; the current CI runs the
  existing `check` command on Windows. Any new CI scope needs an explicit request.
