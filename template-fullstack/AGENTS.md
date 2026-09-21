# Project conventions

Full-stack TypeScript app in one package: React 19 SPA (Vite), Hono API, SQLite. Read this before changing code.

## Stack (pinned versions in package.json)

- UI: the full shadcn/ui set in `src/components/ui`, one folder per component (`button/button.tsx`, `button/index.ts`, `button/styles.css`), imported as `@/components/ui/button`. Radix via `radix-ui`, Tailwind 4, icons from `lucide-react`. Never add a component by hand or with `npx shadcn add`: everything the registry has is already here. Extra CSS for a component goes into its `styles.css`.
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

## Pages: describe them in meta

A page is `meta/pages/<id>.json` with `type`, `id` (= file name), `name` (the URL is derived from it) and `rows`: a grid of `{ "columns": [{ "field": … }] }` where a field is a component from `src/components/ui`, `{ "type": "button", "id": "create", "props": { … } }`, where `props` are that component's props. Nothing to run: the app reads `meta/` at startup (`src/meta/`) and builds the route, the navigation link and the page from it. `npm run verify` opens every page in meta and checks it.

## New entity: use the generator

A whole new entity (its own table, API, list page and form) is not written by hand. Describe it in `entities/<plural>.json` and run:

```
npm run gen:entity -- entities/<plural>.json
```

It creates the contract, the table with a migration, seed rows, REST routes under `/api/<plural>` with tests, RTK Query endpoints, the form, the list, the pages at `/<plural>` and `/<plural>/new`, the route and the navigation link, all in the `tasks` patterns. `npm run verify` passes right after it. Then add only what the task needs beyond that: business rules, relations, extra endpoints, custom UI. The generator is not for changing an entity that already exists: edit that by hand.

The description, `fields` in the order of the form:

```json
{
  "singular": "employee",
  "plural": "employees",
  "fields": [
    { "name": "name", "label": "Name", "kind": "text", "max": 100 },
    { "name": "email", "label": "Email", "kind": "email", "unique": true },
    {
      "name": "department",
      "label": "Department",
      "kind": "enum",
      "options": [
        ["engineering", "Engineering"],
        ["design", "Design"]
      ],
      "default": "engineering"
    },
    { "name": "startDate", "label": "Start date", "kind": "date", "optional": true }
  ]
}
```

Field kinds: `text` (`max`, optional `min`, `unique`), `email` (`unique`), `textarea` (`max`, `optional`), `enum` (`options` as `[value, label]` pairs, optional `default`), `bool` (`default`), `int` (`min`, `max`), `money` (up to two decimals, greater than 0), `date` (ISO date, `optional` makes it nullable). Optional keys: `columns` (field names shown in the table, the first names the row and must be a text or email field; by default the first text field and up to three others) and `seeds` (at least two rows; by default two are made up). A unique field answers 409 with `{ "message": "A <singular> with this <label> already exists" }`; a required text field shows `<Label> is required`.

## Work in stages

A feature that crosses layers is built in this order, and `npm run verify` must pass before moving to the next stage:

1. Contract in `shared/`, table in `server/db/schema.ts`, `npm run db:generate`, seed rows if useful. For a whole new entity this stage and stages 2–5 come from `npm run gen:entity`: run it, verify, then adapt.
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
