import fs from 'node:fs';
import path from 'node:path';

import { BENCH_DIR, TASKS_DIR } from '../paths.ts';
import type { Layer, Work } from '../types.ts';

/**
 * Generates the task pool for the teacher runs: prompts laid out on a grid
 * (layer × work × domain × difficulty × formulation) with templated variations,
 * deduplicated against the benchmark and within the pool. Each pool task is a normal
 * task directory (task.json, prompt.md, optional setup/) so the bench runner can run it
 * with BENCH_TASKS_DIR pointing at the pool.
 */

type Domain = 'tasks' | 'contacts' | 'projects';

interface Entity {
  domain: Domain;
  singular: string;
  plural: string;
  Plural: string;
  listPath: string;
  newPath: string;
  formFile: string;
  listFile: string;
  pageFile: string;
  apiFile: string;
  modelFile: string;
  /** Text field with a label the prompt can refer to. */
  textField: { name: string; label: string };
  /** A field whose values the prompt can enumerate (for filters, badges). */
  enumField?: { name: string; label: string; values: string[]; labels: string[] };
  /** Path of the setup overlay that adds the entity to the template, if any. */
  overlay?: string;
  seeds: string[];
}

const ENTITIES: Entity[] = [
  {
    domain: 'tasks',
    singular: 'task',
    plural: 'tasks',
    Plural: 'Tasks',
    listPath: '/',
    newPath: '/tasks/new',
    formFile: 'src/features/tasks/task-form.tsx',
    listFile: 'src/features/tasks/task-list.tsx',
    pageFile: 'src/pages/tasks-page.tsx',
    apiFile: 'src/features/tasks/api.ts',
    modelFile: 'src/features/tasks/model.ts',
    textField: { name: 'title', label: 'Title' },
    enumField: { name: 'status', label: 'Status', values: ['todo', 'in_progress', 'done'], labels: ['To do', 'In progress', 'Done'] },
    seeds: ['Set up the project', 'Write the task form', 'Add tests'],
  },
  {
    domain: 'contacts',
    singular: 'contact',
    plural: 'contacts',
    Plural: 'Contacts',
    listPath: '/contacts',
    newPath: '/contacts/new',
    formFile: 'src/features/contacts/contact-form.tsx',
    listFile: 'src/features/contacts/contact-list.tsx',
    pageFile: 'src/pages/contacts-page.tsx',
    apiFile: 'src/features/contacts/api.ts',
    modelFile: 'src/features/contacts/model.ts',
    textField: { name: 'name', label: 'Name' },
    overlay: path.join(BENCH_DIR, 'tasks', 'T07-contacts-feature', 'solution'),
    seeds: ['Grace Hopper', 'Linus Torvalds'],
  },
  {
    domain: 'projects',
    singular: 'project',
    plural: 'projects',
    Plural: 'Projects',
    listPath: '/projects',
    newPath: '/projects/new',
    formFile: 'src/features/projects/project-form.tsx',
    listFile: 'src/features/projects/project-list.tsx',
    pageFile: 'src/pages/projects-page.tsx',
    apiFile: 'src/features/projects/api.ts',
    modelFile: 'src/features/projects/model.ts',
    textField: { name: 'name', label: 'Name' },
    overlay: path.join(BENCH_DIR, 'tasks', 'T32-projects-feature', 'solution'),
    seeds: ['Website relaunch', 'Internal tooling'],
  },
];

interface Template {
  layer: Layer;
  work: Work;
  difficulty: 1 | 2 | 3;
  formulation: 'spec' | 'product';
  /** Which entities the template applies to; default all. */
  domains?: Domain[];
  /** Variations: each produces one prompt. `e` is the entity. */
  variants: (e: Entity) => string[];
  /** Planted-bug overlays are expressed as a mutation of a template file. */
  setup?: (e: Entity) => Record<string, [string, string][]>;
}

const NEW_FIELDS = [
  { name: 'notes', label: 'Notes', kind: 'textarea', rule: 'optional, up to 300 characters' },
  { name: 'owner', label: 'Owner', kind: 'text', rule: 'required, 2 to 60 characters' },
  { name: 'website', label: 'Website', kind: 'url', rule: 'optional, must be a valid URL when present' },
  { name: 'estimate', label: 'Estimate (hours)', kind: 'number', rule: 'optional, an integer between 1 and 100' },
  { name: 'tags', label: 'Tags', kind: 'text', rule: 'optional, comma-separated, each tag up to 20 characters' },
  { name: 'startDate', label: 'Start date', kind: 'date', rule: 'optional, ISO date YYYY-MM-DD' },
  { name: 'phone', label: 'Phone', kind: 'tel', rule: 'optional, digits, spaces, + and - only, 7 to 20 characters' },
  { name: 'budget', label: 'Budget', kind: 'number', rule: 'optional, a non-negative number with up to two decimals' },
  { name: 'department', label: 'Department', kind: 'select', rule: 'required, one of Engineering, Design, Sales' },
  { name: 'archived', label: 'Archived', kind: 'checkbox', rule: 'boolean, default false' },
  { name: 'reference', label: 'Reference code', kind: 'text', rule: 'optional, exactly 6 uppercase letters or digits' },
  { name: 'summary', label: 'Summary', kind: 'text', rule: 'optional, up to 80 characters, shown truncated in the table' },
];

const PLACEHOLDERS = ['Enter a {field}', 'What is the {field}?', 'Type the {field} here'];
const MIN_RULES: [number, string][] = [[3, '{Field} is too short'], [5, 'Use at least 5 characters'], [2, '{Field} needs at least 2 characters']];
const SEARCH_LABELS = ['Search', 'Find', 'Filter by {field}'];
const COUNT_FORMATS = ['{Plural} (N)', '{Plural} · N', 'N {plural}'];
const REFRESH_LABELS = ['Refresh', 'Reload', 'Update list'];
const SORT_LABELS = ['Sort by {field}', 'Order by {field}', 'A→Z'];

const HEADINGS = ['All {plural}', 'Your {plural}', '{Plural} overview', 'My {plural}'];
const BUTTON_TEXTS = ['Add {singular}', 'Create {singular}', 'New {singular} +'];
const MESSAGES = ['Could not save the {singular}', 'Saving failed, try again', 'The {singular} was not saved'];

const TEMPLATES: Template[] = [
  // ---------- component ----------
  {
    layer: 'component', work: 'modify', difficulty: 1, formulation: 'spec',
    variants: (e) => HEADINGS.map((h) => `Change the heading of the ${e.plural} page to "${h.replace('{plural}', e.plural).replace('{Plural}', e.Plural)}". Navigation links stay as they are. Update existing tests if the change requires it.`),
  },
  {
    layer: 'component', work: 'modify', difficulty: 1, formulation: 'spec',
    variants: (e) => BUTTON_TEXTS.map((b) => `On the ${e.plural} page, rename the button that leads to ${e.newPath} to "${b.replace('{singular}', e.singular)}". Leave the header navigation unchanged. Update existing tests if needed.`),
  },
  {
    layer: 'component', work: 'modify', difficulty: 1, formulation: 'product',
    variants: (e) => [
      ...COUNT_FORMATS.map((f) => `Users cannot tell how many ${e.plural} there are at a glance. Show the number of loaded ${e.plural} next to the page heading in the format "${f.replace('{Plural}', e.Plural).replace('{plural}', e.plural)}". Update existing tests if needed.`),
      `The ${e.plural} table looks bare when a row has no ${e.textField.label.toLowerCase()} details. Show a muted dash "—" in any empty cell instead of leaving it blank.`,
      `Long ${e.textField.label.toLowerCase()}s break the layout of the ${e.plural} table. Truncate the ${e.textField.label.toLowerCase()} cell to one line with an ellipsis and show the full text in the title attribute.`,
    ],
  },
  {
    layer: 'component', work: 'create', difficulty: 1, formulation: 'spec',
    variants: (e) => [
      `Create a reusable \`PageHeader\` component at \`src/components/page-header.tsx\` with props \`title: string\` and \`action?: ReactNode\`, rendering the title as an \`h1\` and the action on the right. Use it on the ${e.plural} page.`,
      `Create a reusable \`InlineError\` component at \`src/components/inline-error.tsx\` that renders its \`message: string\` prop in a paragraph with \`role="alert"\` and destructive text colour. Use it on the ${e.plural} page error state instead of the Alert.`,
      `Create a \`CountBadge\` component at \`src/components/count-badge.tsx\` that renders a number inside an outline Badge, and show the number of ${e.plural} with it next to the heading on the ${e.plural} page.`,
    ],
  },
  {
    layer: 'component', work: 'modify', difficulty: 2, formulation: 'product',
    variants: (e) => [
      ...SORT_LABELS.map((l) => `Users want to sort the ${e.plural} table by ${e.textField.label.toLowerCase()}. Add a "${l.replace('{field}', e.textField.label.toLowerCase())}" toggle button above the table that switches between ascending and descending order, on the client.`),
      `Users lose track of which ${e.singular} they just created. After creating one, highlight its row in the list (for example with a muted background) until the page is reloaded.`,
      ...SEARCH_LABELS.map((l) => `The ${e.plural} list is hard to scan. Add a "${l.replace('{field}', e.textField.label.toLowerCase())}" input above the table that filters rows by ${e.textField.label.toLowerCase()} as the user types, case-insensitive, and shows "No matches" when nothing matches.`),
    ],
  },
  // ---------- form ----------
  {
    layer: 'form', work: 'modify', difficulty: 2, formulation: 'spec',
    variants: (e) => NEW_FIELDS.map((f) => `Add a "${f.label}" field to the ${e.singular} form (${f.kind === 'textarea' ? 'a textarea' : `an input of type ${f.kind}`}): ${f.rule}. Store it as \`${f.name}\` on the ${e.singular}; existing ${e.plural}, mock data and API calls without it keep working. Show it in the ${e.plural} table. Update existing tests if needed.`),
  },
  {
    layer: 'form', work: 'modify', difficulty: 1, formulation: 'spec',
    variants: (e) => [
      ...PLACEHOLDERS.map((ph) => `Add the placeholder "${ph.replace('{field}', e.textField.label.toLowerCase())}" to the ${e.textField.label} input of the ${e.singular} form.`),
      `Add a "Reset" button of type reset next to the submit button of the ${e.singular} form that restores the default values.`,
      `Add a "Cancel" link styled as an outline button next to the submit button of the ${e.singular} form, leading to ${e.listPath}.`,
      `The ${e.textField.label} field of the ${e.singular} form should be focused automatically when the form mounts.`,
    ],
  },
  {
    layer: 'form', work: 'modify', difficulty: 2, formulation: 'product',
    variants: (e) => [
      `People keep submitting ${e.plural} with a ${e.textField.label.toLowerCase()} that is just spaces. Reject those with the message "${e.textField.label} cannot be blank" and make sure the mock API rejects them too. Update existing tests if needed.`,
      ...MIN_RULES.map(([n, msg]) => `The ${e.textField.label} of a ${e.singular} must be at least ${String(n)} characters long, with the message "${msg.replace('{Field}', e.textField.label)}". Put the rule in the zod schema so the mock API enforces it. Update existing tests if needed.`),
      `Two ${e.plural} with the same ${e.textField.label.toLowerCase()} confuse users. When creating a ${e.singular} whose ${e.textField.label.toLowerCase()} already exists (case-insensitive), the mock API must answer 409 with { message: "Duplicate ${e.singular}" } and the form must show that message above the fields.`,
    ],
  },
  // ---------- query ----------
  {
    layer: 'query', work: 'modify', difficulty: 2, formulation: 'product',
    variants: (e) => MESSAGES.map((m) => `When saving a new ${e.singular} fails on the server, nothing happens and the user is left guessing. Show the message "${m.replace('{singular}', e.singular)}" above the form when the create request fails, and keep the entered values in the form.`),
  },
  {
    layer: 'query', work: 'create', difficulty: 2, formulation: 'spec',
    variants: (e) => [
      `Add a \`get${e.Plural}Count\` query endpoint: \`GET /api/${e.plural}/count\` returns \`{ count: number }\`. Add the MSW handler backed by the in-memory db (register it before any \`/:id\` handler). Show "N ${e.plural} in total" under the heading of the ${e.plural} page once loaded.`,
      `Add a \`getRecent${e.Plural}\` query endpoint: \`GET /api/${e.plural}/recent\` returns the last two ${e.plural} in the db. Add the MSW handler (before any \`/:id\` handler) and render the result as a "Recent" list of names under the table on the ${e.plural} page.`,
      `Add a \`delete${e.Plural.slice(0, -1)}\` mutation if it does not exist and a "Delete" button with a confirmation dialog in each row of the ${e.plural} table, invalidating the list tag so the row disappears.`,
    ],
  },
  {
    layer: 'query', work: 'modify', difficulty: 1, formulation: 'spec',
    variants: (e) => [
      ...REFRESH_LABELS.map((l) => `Add a "${l}" button next to the heading of the ${e.plural} page that refetches the ${e.plural} from the API.`),
      `The ${e.plural} query should refetch automatically when the browser tab regains focus: enable \`refetchOnFocus\` for it and set up the RTK Query listeners in the store.`,
      `Poll the ${e.plural} list every 30 seconds while the ${e.plural} page is open, using RTK Query's \`pollingInterval\`.`,
    ],
  },
  // ---------- routing ----------
  {
    layer: 'routing', work: 'create', difficulty: 2, formulation: 'product',
    variants: (e) => [
      `Add a details page for a ${e.singular}: clicking its ${e.textField.label.toLowerCase()} in the list opens \`${e.listPath === '/' ? '/tasks' : e.listPath}/:${e.singular}Id\`, which shows the ${e.singular}'s fields and a "Back" link to the list. Unknown ids show "${e.Plural.slice(0, -1)} not found".`,
      `Visiting \`${e.listPath === '/' ? '/tasks' : e.listPath}/all\` should redirect to the ${e.plural} list (\`${e.listPath}\`), replacing the history entry.`,
      `The not-found page should show the requested path as "No page at <pathname>" and keep a link back to ${e.listPath}.`,
    ],
  },
  // ---------- test ----------
  {
    layer: 'test', work: 'test', difficulty: 2, formulation: 'spec',
    variants: (e) => [
      `Write a test file for \`${e.listFile.split('/').pop()?.replace('.tsx', '')}\` next to it: it renders the given ${e.plural}, and shows the empty message when the list is empty. Query by role and text, following the project's testing conventions.`,
      `Add a test to the ${e.plural} page tests: when \`GET /api/${e.plural}\` answers 500 the error state is shown, and after \`server.use\` with a one-time failing handler, clicking "Try again" loads the list.`,
      `Write a test for the ${e.singular} form: submitting with an empty ${e.textField.label} shows the validation message and does not call onSubmit; submitting valid values calls onSubmit once with them.`,
    ],
  },
  // ---------- mock ----------
  {
    layer: 'mock', work: 'modify', difficulty: 1, formulation: 'spec',
    variants: (e) => [
      `\`GET /api/${e.plural}\` must support an optional \`q\` query parameter that filters ${e.plural} whose ${e.textField.label.toLowerCase()} contains it, case-insensitive. Without it all ${e.plural} are returned. Implement it in the MSW handler.`,
      `\`GET /api/${e.plural}\` must support \`limit\` and \`offset\` query parameters for pagination in the MSW handler; without them all ${e.plural} are returned.`,
      `The mock API must answer \`GET /api/${e.plural}/:id\` for an unknown id with 404 and the body \`{ "message": "${e.Plural.slice(0, -1)} <id> not found" }\`.`,
    ],
  },
  // ---------- fix (planted bugs) ----------
  {
    layer: 'query', work: 'fix', difficulty: 2, formulation: 'product',
    domains: ['tasks'],
    variants: () => ['Bug report: after creating a task, the list still shows the old rows until the page is reloaded. Find the cause and fix it the way the rest of the app manages its cache.'],
    setup: () => ({ 'src/features/tasks/api.ts': [["      invalidatesTags: [{ type: 'Task', id: 'LIST' }],\n    }),\n\n    updateTask", "    }),\n\n    updateTask"]] }),
  },
  {
    layer: 'form', work: 'fix', difficulty: 2, formulation: 'product',
    domains: ['tasks'],
    variants: () => ['Bug report: the task form accepts an empty title and the API then rejects it with a 400. Validation should catch it before submit. Find and fix the cause.'],
    setup: () => ({ 'src/features/tasks/task-form.tsx': [['resolver: zodResolver(taskInputSchema),', '']] }),
  },
  {
    layer: 'component', work: 'fix', difficulty: 1, formulation: 'product',
    domains: ['tasks'],
    variants: () => ['Bug report: every task in the list shows the "To do" badge even when it is done. Fix it.'],
    setup: () => ({ 'src/features/tasks/task-badges.tsx': [['{TASK_STATUS_LABELS[status]}', '{TASK_STATUS_LABELS.todo}']] }),
  },
  // ---------- config ----------
  {
    layer: 'config', work: 'modify', difficulty: 1, formulation: 'spec',
    domains: ['tasks'],
    variants: () => [
      'Add a typed environment variable `VITE_APP_NAME` (declared in `src/env.d.ts`, defaulting to "Template" in `.env.development`) and use it for the brand text in the header instead of the hard-coded "Template".',
      'Add an npm script `check:types` that runs `tsc --noEmit` and make `verify` use it instead of the inline `typecheck` script; keep `typecheck` as an alias.',
      'Enable the `@typescript-eslint/switch-exhaustiveness-check` rule as an error in the ESLint config and fix any code that violates it.',
      'Add Vitest coverage: a `test:coverage` npm script using the v8 provider that writes reports to `coverage/`, and make sure `coverage/` is ignored by git, ESLint and Prettier.',
      'Move the MSW handlers for tasks into `src/mocks/handlers/tasks.ts` and re-export them from `src/mocks/handlers.ts`, keeping every import working.',
    ],
  },
  // ---------- more test ----------
  {
    layer: 'test', work: 'test', difficulty: 1, formulation: 'spec',
    variants: (e) => [
      `Write a test for the ${e.plural} page: while \`GET /api/${e.plural}\` is pending (use \`delay()\` from msw in a \`server.use\` handler) the loading skeleton is shown, and afterwards the seeded rows appear.`,
      `Write a test proving that \`GET /api/${e.plural}/:id\` from the mock API returns 404 for an unknown id and the ${e.singular} for a known one, using \`fetch\` against the MSW server.`,
      `Add a test for the ${e.singular} form that submits with \`userEvent\` and checks the submit button is disabled while \`onSubmit\` is still pending (return a promise that resolves later).`,
      `Write a test for the main navigation: every link in the header has an href and the link for the ${e.plural} page carries the active style when the route matches.`,
    ],
  },
  {
    layer: 'test', work: 'test', difficulty: 2, formulation: 'product',
    variants: (e) => [
      `We keep breaking the ${e.plural} list without noticing. Cover \`${e.listFile}\` with tests: rendering rows for given ${e.plural}, the empty message, and that each row shows the ${e.textField.label.toLowerCase()}.`,
      `The create flow for ${e.plural} has no end-to-end style test. Write one with \`renderApp\`: open ${e.newPath}, fill the form, submit, and assert the new ${e.singular} shows up in the list at ${e.listPath}.`,
    ],
  },
  // ---------- more mock ----------
  {
    layer: 'mock', work: 'modify', difficulty: 2, formulation: 'spec',
    variants: (e) => [
      `Add \`PUT /api/${e.plural}/:id\` to the MSW handlers: replaces the whole ${e.singular} after validating the body with the input schema, 404 for unknown ids, 400 for invalid bodies. Extend the in-memory db accordingly.`,
      `Add a \`sort\` query parameter to \`GET /api/${e.plural}\` in the MSW handler: \`sort=${e.textField.name}\` returns ${e.plural} ordered by ${e.textField.label.toLowerCase()} ascending, \`sort=-${e.textField.name}\` descending, no parameter keeps db order.`,
      `Simulate latency in the mock API: every handler for \`/api/${e.plural}\` waits 300 ms (msw \`delay\`) in the browser worker only, not in tests. Keep the handlers shared, so the delay must be injected from \`browser.ts\`.`,
      `Add request logging to the mock API: every handled request for \`/api/${e.plural}\` appends \`{ method, url, status }\` to an exported \`requestLog\` array in \`src/mocks/log.ts\`, and \`db.reset()\` clears it.`,
    ],
  },
  // ---------- more routing ----------
  {
    layer: 'routing', work: 'modify', difficulty: 1, formulation: 'spec',
    variants: (e) => [
      `Make the browser tab title follow the route: "${e.Plural}" on ${e.listPath} and "New ${e.singular}" on ${e.newPath}, using \`document.title\` in a small \`usePageTitle\` hook under \`src/app\`.`,
      `Add a "Back to ${e.plural}" link at the top of the new-${e.singular} page that navigates to ${e.listPath}.`,
      `Mark the active navigation link with \`aria-current="page"\` in the header, using NavLink's render props.`,
    ],
  },
  {
    layer: 'routing', work: 'modify', difficulty: 2, formulation: 'product',
    variants: (e) => [
      `Users bookmark filtered views. Keep the ${e.plural} search text in the URL as \`?q=\` on ${e.listPath}, restore it on load, and update it as the user types (use \`useSearchParams\`). Add the search box if it does not exist yet.`,
      `Deep links to a missing ${e.singular} show a blank page. Add an error element for the ${e.plural} routes that renders "Something went wrong" with a link back to ${e.listPath} whenever a route throws.`,
    ],
  },
  // ---------- more config ----------
  {
    layer: 'config', work: 'modify', difficulty: 2, formulation: 'spec',
    domains: ['tasks'],
    variants: () => [
      'Add the `date-fns` dependency (pin the exact latest version) and use its `format` to render dates as "d MMM yyyy" in a new `formatDate` helper in `src/lib/format.ts` with a unit test.',
      'Add the shadcn `tooltip` component through the CLI (`npx shadcn@4.21.0 add tooltip`), run the formatter, and wrap the delete buttons in the tasks table with a tooltip reading "Delete this task".',
      'Add a `lint:strict` npm script that runs ESLint with `--max-warnings 0`, and make `verify` use it. Ensure the current code passes.',
      'Turn on `noPropertyAccessFromIndexSignature` in tsconfig and fix every place the compiler complains about.',
      'Add an `.env.example` documenting every `VITE_` variable the app reads, and a `check:env` script that fails if `.env.development` lacks any key present in `.env.example`.',
      'Split the Vite build into vendor chunks: React, Redux and Radix each in their own chunk via `build.rolldownOptions.output` (or the equivalent for this Vite version), and confirm `npm run build` lists them.',
    ],
  },
  // ---------- more planted bugs ----------
  {
    layer: 'routing', work: 'fix', difficulty: 1, formulation: 'product',
    domains: ['tasks'],
    variants: () => ['Bug report: the "Edit" link in every row opens the wrong task (always the first one). Fix it.'],
    setup: () => ({ 'src/features/tasks/task-list.tsx': [['<Link to={`/tasks/${task.id}/edit`}>Edit</Link>', "<Link to={`/tasks/${tasks[0]?.id ?? task.id}/edit`}>Edit</Link>"]] }),
  },
  {
    layer: 'mock', work: 'fix', difficulty: 1, formulation: 'product',
    domains: ['tasks'],
    variants: () => ['Bug report: creating a task in the dev server answers 200 but the task never appears in the list, even after a reload. Find the cause in the mock layer and fix it.'],
    setup: () => ({ 'src/mocks/handlers.ts': [['return HttpResponse.json(db.create(parsed.data), { status: 201 });', "return HttpResponse.json({ id: '0', ...parsed.data }, { status: 201 });"]] }),
  },
  {
    layer: 'form', work: 'fix', difficulty: 1, formulation: 'product',
    domains: ['tasks'],
    variants: () => ['Bug report: on the task form the validation error for the title is rendered but the input is not marked as invalid for screen readers. Fix it consistently with the other fields.'],
    setup: () => ({ 'src/features/tasks/task-form.tsx': [['<Input {...field} id="task-title" aria-invalid={fieldState.invalid} />', '<Input {...field} id="task-title" />']] }),
  },
  {
    layer: 'query', work: 'fix', difficulty: 2, formulation: 'product',
    domains: ['tasks'],
    variants: () => ['Bug report: editing a task and saving shows the old values on the list until a reload. Fix the cache handling.'],
    setup: () => ({
      'src/features/tasks/api.ts': [
        ["      invalidatesTags: (_result, _error, { id }) => [{ type: 'Task', id }],\n    }),\n\n    deleteTask", "    }),\n\n    deleteTask"],
      ],
    }),
  },
  {
    layer: 'component', work: 'fix', difficulty: 1, formulation: 'product',
    domains: ['tasks'],
    variants: () => ['Bug report: the delete confirmation dialog deletes the wrong task: whichever row you pick, the first task disappears. Fix it.'],
    setup: () => ({ 'src/features/tasks/delete-task-button.tsx': [["await deleteTask(task.id).unwrap();", "await deleteTask('1').unwrap();"]] }),
  },
  // ---------- refactor ----------
  {
    layer: 'form', work: 'refactor', difficulty: 2, formulation: 'product',
    variants: (e) => [`The ${e.singular} form repeats the same Field + Input + FieldError markup for every text input. Extract a reusable \`TextField\` component wired to react-hook-form so the form no longer repeats it, without changing behaviour or tests.`],
  },
  {
    layer: 'component', work: 'refactor', difficulty: 2, formulation: 'product',
    variants: (e) => [`The loading skeleton on the ${e.plural} page is inline JSX. Extract it into a \`TableSkeleton\` component with a \`rows\` prop (default 3) under \`src/components\` and use it on the page, without changing the rendered output.`],
  },
  // ---------- cross ----------
  {
    layer: 'cross', work: 'create', difficulty: 3, formulation: 'product',
    domains: ['tasks'],
    variants: () => [
      'Add Notes: a list at /notes showing each note\'s title, a "Notes" link in the main navigation, and a form at /notes/new with a "Title" (required) and "Body" (textarea, required) and a "Create" button that returns to the list. Follow the same layering as tasks, including the mock API at /api/notes.',
      'Add Orders: a list at /orders showing customer name and total, an "Orders" link in the navigation, a form at /orders/new with "Customer" (required) and "Total" (number, positive) fields and a "Create" button that returns to the list. Same layering as tasks, mock API at /api/orders.',
      'Add Tags as a first-class entity: a list at /tags with name and colour (one of red, green, blue), a "Tags" nav link, a form at /tags/new with "Name" (required) and a "Colour" select, a "Create" button returning to the list. Same layering as tasks, mock API at /api/tags.',
    ],
  },
];

// ---------- dedup ----------
const ENTITY_WORDS = /\b(tasks?|contacts?|projects?|title|name|email|deadline|status|todo|done)\b/g;

/** Entity-specific words are masked so the same template on another entity is not a duplicate. */
function masked(text: string): string {
  return text.replace(ENTITY_WORDS, 'ENTITY');
}

function shingles(text: string): Set<string> {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + 2 < words.length; i += 1) out.add(`${words[i]!} ${words[i + 1]!} ${words[i + 2]!}`);
  return out;
}

function similarity(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  return inter / (a.size + b.size - inter || 1);
}

function benchmarkPrompts(): Set<string>[] {
  const dir = path.join(BENCH_DIR, 'tasks');
  return fs
    .readdirSync(dir)
    .filter((name) => fs.existsSync(path.join(dir, name, 'prompt.md')))
    .map((name) => shingles(fs.readFileSync(path.join(dir, name, 'prompt.md'), 'utf8')));
}

// ---------- generation ----------
export interface PoolOptions {
  outDir: string;
  /** Similarity above which a prompt is dropped (vs benchmark or earlier pool prompts). */
  threshold?: number;
}

export function generatePool({ outDir, threshold = 0.5 }: PoolOptions): void {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const bench = benchmarkPrompts();
  /** Accepted prompts per domain, masked, for within-pool dedup. */
  const accepted = new Map<Domain, Set<string>[]>();
  const coverage = new Map<string, number>();
  let dropped = 0;
  let index = 0;

  for (const template of TEMPLATES) {
    const domains = template.domains ?? ENTITIES.map((e) => e.domain);
    for (const entity of ENTITIES.filter((e) => domains.includes(e.domain))) {
      for (const prompt of template.variants(entity)) {
        const sh = shingles(prompt);
        const shMasked = shingles(masked(prompt));
        const sameDomain = accepted.get(entity.domain) ?? [];
        const tooClose =
          bench.some((other) => similarity(sh, other) >= threshold) ||
          sameDomain.some((other) => similarity(shMasked, other) >= 0.8);
        if (tooClose) {
          dropped += 1;
          continue;
        }
        accepted.set(entity.domain, [...sameDomain, shMasked]);
        index += 1;
        const id = `P${String(index).padStart(4, '0')}-${template.layer}-${template.work}-${entity.domain}`;
        const dir = path.join(outDir, id);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(
          path.join(dir, 'task.json'),
          JSON.stringify(
            { id, title: prompt.slice(0, 70), layer: template.layer, work: template.work, difficulty: template.difficulty, formulation: template.formulation, tags: ['pool', entity.domain] },
            null,
            2,
          ) + '\n',
        );
        fs.writeFileSync(path.join(dir, 'prompt.md'), `${prompt}\n`);
        // Setup overlay: the entity's feature (if not in the template) plus planted bugs.
        const setupDir = path.join(dir, 'setup');
        if (entity.overlay) fs.cpSync(entity.overlay, setupDir, { recursive: true });
        if (template.setup) {
          // A planted bug is fixed when the removed line is back: emit a structural check for it.
          const checks: { type: 'grep-count'; path: string; pattern: string; min: number }[] = [];
          for (const [file, edits] of Object.entries(template.setup(entity))) {
            for (const [from, to] of edits) {
              const removedLine = from
                .split('\n')
                .map((line) => line.trim())
                .find((line) => line.length > 0 && !to.includes(line));
              if (removedLine) checks.push({ type: 'grep-count', path: file, pattern: removedLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), min: 1 });
            }
          }
          if (checks.length > 0) fs.writeFileSync(path.join(dir, 'checks.json'), JSON.stringify(checks, null, 2) + '\n');
          for (const [file, edits] of Object.entries(template.setup(entity))) {
            const source = fs.existsSync(path.join(setupDir, file)) ? path.join(setupDir, file) : path.join(BENCH_DIR, '..', 'template', file);
            let content = fs.readFileSync(source, 'utf8');
            for (const [from, to] of edits) {
              if (!content.includes(from)) throw new Error(`${id}: planted-bug anchor not found in ${file}`);
              content = content.replace(from, to);
            }
            fs.mkdirSync(path.dirname(path.join(setupDir, file)), { recursive: true });
            fs.writeFileSync(path.join(setupDir, file), content);
          }
        }
        const key = `${template.layer}/${template.work}/d${String(template.difficulty)}/${template.formulation}`;
        coverage.set(key, (coverage.get(key) ?? 0) + 1);
      }
    }
  }

  console.log(`pool: ${String(index)} prompts written to ${outDir}, ${String(dropped)} dropped as near-duplicates (threshold ${String(threshold)})`);
  console.log('\ncoverage (layer/work/difficulty/formulation → prompts):');
  for (const [key, count] of [...coverage].sort()) console.log(`  ${key.padEnd(34)} ${String(count)}`);
  const byLayer = new Map<string, number>();
  for (const [key, count] of coverage) {
    const layer = key.split('/')[0]!;
    byLayer.set(layer, (byLayer.get(layer) ?? 0) + count);
  }
  console.log('\nby layer: ' + [...byLayer].sort().map(([k, v]) => `${k} ${String(v)}`).join(', '));
}

if (process.argv[1]?.endsWith('pool.ts')) {
  generatePool({ outDir: process.argv[2] ?? path.join(BENCH_DIR, 'pool', 'tasks') });
}

export { TASKS_DIR as DEFAULT_TASKS_DIR };
