# Project conventions

React 19 + TypeScript SPA built with Vite. Read this before changing code.

## Stack (pinned versions in package.json)

- UI: shadcn/ui components in `src/components/ui` (Radix via `radix-ui`), Tailwind 4, icons from `lucide-react`.
- Data: Redux Toolkit 2 + RTK Query. One API in `src/api/base-api.ts`; features add endpoints with `injectEndpoints`.
- Forms: react-hook-form + zod 4, rendered with `Field` components and `Controller`.
- Routing: React Router 8 in library mode, routes in `src/app/router.tsx`.
- Tests: Vitest + React Testing Library + MSW. Mocks in `src/mocks` are shared by dev and tests.

## Layout

- `src/app` store, router, layout, providers.
- `src/api` the single `baseApi`.
- `src/features/<name>` model (types + zod), api (endpoints), components, tests next to code.
- `src/pages` route components; they fetch data, feature components stay presentational.
- `src/mocks` MSW handlers and the in-memory db.
- `src/test` render helpers and setup.

## Rules

- Follow the existing patterns exactly: see `src/features/tasks` for the canonical example of every layer.
- Import with the `@/` alias, never relative paths across folders.
- Validation lives in zod schemas; derive types with `z.infer`. Never duplicate a type by hand.
- New entity: add its tag to `tagTypes` in `base-api.ts`, tag every query, invalidate from mutations.
- Forms: one `Controller` per input, `aria-invalid` and `FieldError` on every field, `noValidate` on the form.
- Tests use `renderWithProviders` or `renderApp` from `src/test/render.tsx`, query by role and label, mock the network with MSW handlers, never mock hooks.
- Use `cn()` from `@/lib/utils` to compose class names. Only Tailwind theme tokens (`bg-background`, `text-muted-foreground`, ...), no raw colors.
- TypeScript is strict: no `any`, no non-null assertions outside tests, handle `undefined` from indexed access.

## Verify before you finish

```
npm run verify
```

Runs typecheck, lint, format check and tests. All four must pass.
