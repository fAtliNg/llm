# Template

React 19 + TypeScript + Vite starter with the stack fixed for this project:
shadcn/ui on Tailwind 4, Redux Toolkit with RTK Query, react-hook-form with zod 4,
React Router 8, Vitest with React Testing Library and MSW.

## Requirements

Node 22.12+ (`nvm use` reads `.nvmrc`). npm 11 is recommended: npm 10 has a known
peer-resolution crash on this dependency set, use `npx npm@latest install` if you hit it.

## Commands

| Command                             | What it does                                                  |
| ----------------------------------- | ------------------------------------------------------------- |
| `npm run dev`                       | Dev server with MSW mocking `/api` in the browser             |
| `npm run verify`                    | Typecheck, lint, format check, tests. Run before every commit |
| `npm run test:watch`                | Vitest in watch mode                                          |
| `npm run build`                     | Typecheck and production build                                |
| `npx shadcn@4.21.0 add <component>` | Add a shadcn component, then `npm run format`                 |

## Where things live

See [AGENTS.md](AGENTS.md): it is the source of truth for conventions and layout.
The `tasks` feature in `src/features/tasks` is the reference implementation of every layer.
