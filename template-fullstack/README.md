# Full-stack template

React 19 + Hono + SQLite in one package. The front end is the same as `template/`; this one adds `server/`, `shared/` and `drizzle/`. Conventions for agents and humans are in `AGENTS.md`.

```bash
npm install
npm run dev       # API on :3000, Vite on :5173 with /api proxied
npm run verify    # typecheck, lint, format check, web and API tests
```
