# Project conventions

Full-stack TypeScript app in one package: React 19 SPA (Vite), Hono API, SQLite. Read this before changing code.

## Stack (pinned versions in package.json)

- UI: shadcn/ui components in `src/components/ui` (Radix via `radix-ui`), Tailwind 4, icons from `lucide-react`.
- Data on the client: Redux Toolkit 2 + RTK Query. One API in `src/api/base-api.ts`; features add endpoints with `injectEndpoints`.
- Forms: react-hook-form + zod 4, rendered with `Field` components and `Controller`.
- Routing: React Router 8 in library mode, routes in `src/app/router.tsx`.
- API: Hono 4 on Node, request validation with `@hono/zod-validator`.
- Database: SQLite (`better-sqlite3`) through Drizzle ORM; SQL migrations in `drizzle/`.
- Tests: Vitest for both sides. Web tests use React Testing Library; API tests call `app.request()`.

## Layout

- `shared/<entity>.ts` the contract: zod schemas and types used by BOTH the API and the web app.
- `server/db/schema.ts` tables. `server/db/seed.ts` demo rows. `server/db/client.ts` opens the database and runs migrations.
- `server/features/<name>/routes.ts` one router per feature, registered in `server/app.ts`. Tests next to code.
- `server/http.ts` error helpers: `notFound`, `conflict`, `invalid`.
- `src/features/<name>` model (re-exports the contract + UI labels), api (RTK Query endpoints), components, tests.
- `src/pages` route components; they fetch data, feature components stay presentational.
- `src/mocks/server.ts` MSW bridge: web tests hit the real API in process with an in-memory database. There are no hand-written mock handlers.
- `src/app` store, router, layout, providers. `src/test` render helpers and setup.

## Rules

- Follow the existing patterns exactly: `tasks` is the canonical example of every layer, from `shared/tasks.ts` to `src/pages`.
- Import with the aliases `@/` (web), `@server/`, `@shared/`. Never relative paths across folders. The web app must not import from `@server/` outside tests.
- The contract comes first. Change `shared/<entity>.ts`, then the table, then the routes, then the web app. Never duplicate a type by hand; derive with `z.infer`.
- Every table has a guard `export type XRowMatchesContract = Assert<Equal<XRow, X>>` in `server/db/schema.ts`. Nullable columns pair with `.nullable()` in the contract, not `.optional()`.
- After any change to `server/db/schema.ts` run `npm run db:generate`. Never edit or delete existing files in `drizzle/`. Never rename a column: add a new one.
- Routes: validate bodies with `zValidator('json', schema, invalid('Invalid <entity>'))`. Errors are JSON `{ message }`: 400 invalid body, 404 unknown id, 409 conflict. Create answers 201, delete answers 204. Read rows with `.all()` and destructure; do not use `.get()`.
- New entity on the web: add its tag to `tagTypes` in `base-api.ts`, tag every query, invalidate from mutations.
- Forms: one `Controller` per input, `aria-invalid` and `FieldError` on every field, `noValidate` on the form.
- Web tests use `renderWithProviders` or `renderApp` from `src/test/render.tsx`, query by role and label, and talk to the real API. Simulate failures with `server.use(http.get('/api/...', ...))`. Never mock hooks.
- API tests build the app with `createApp(createTestDb())` in `beforeEach` and use `app.request()`.
- Use `cn()` from `@/lib/utils` to compose class names. Only Tailwind theme tokens, no raw colors.
- TypeScript is strict: no `any`, no non-null assertions outside tests, handle `undefined` from indexed access.
- Stay inside the project directory. Use relative paths. Do not delete directories.

## Work in stages

A feature that crosses layers is built in this order, and `npm run verify` must pass before moving to the next stage:

1. Contract in `shared/`, table in `server/db/schema.ts`, `npm run db:generate`, seed rows if useful.
2. Routes and their tests, registered in `server/app.ts`.
3. RTK Query endpoints.
4. Components, page, route, navigation link.
5. Web tests.

## Verify before you finish

```
npm run verify
```

Runs typecheck, lint, format check and all tests (web and API). All four must pass. `npm run format` fixes formatting.

## Running it

`npm run dev` starts the API on :3000 and Vite with a proxy for `/api`. The database file is `data/app.db`; delete it to start from the seed.
