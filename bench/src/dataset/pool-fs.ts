import fs from 'node:fs';
import path from 'node:path';

import { BENCH_DIR, templateDir } from '../paths.ts';
import { RU_API, RU_CHILDREN, RU_CONFIG, RU_ENTITIES, RU_FIX, RU_TASK_FIELDS, RU_TEST, RU_WEB } from './pool-fs-ru.ts';
import type { Check, Layer, Work } from '../types.ts';

/**
 * Task pool for the full-stack template (web + Hono API + SQLite). Append-only, like pool.ts.
 *
 * Families: new entity end to end (stage 3), child entity of tasks (stage 3), a field through the whole
 * stack (stage 2), API-only, web-only, planted bugs across layers, tests, project configuration.
 *
 * Entities listed in HELD_OUT are reserved for the benchmark and must never appear here.
 */
export const HELD_OUT = ['invoice', 'employee', 'booking', 'contact', 'project'];

interface FieldSpec {
  name: string;
  label: string;
  /** Human description of the control and the rule, used verbatim in prompts. */
  rule: string;
}

interface EntitySpec {
  singular: string;
  plural: string;
  Singular: string;
  Plural: string;
  path: string;
  fields: FieldSpec[];
  columns: string;
  seeds: string;
}

const E = (singular: string, plural: string, fields: FieldSpec[], columns: string, seeds: string): EntitySpec => ({
  singular,
  plural,
  Singular: singular.charAt(0).toUpperCase() + singular.slice(1),
  Plural: plural.charAt(0).toUpperCase() + plural.slice(1),
  path: `/${plural}`,
  fields,
  columns,
  seeds,
});

const ENTITIES: EntitySpec[] = [
  E('customer', 'customers', [
    { name: 'name', label: 'Name', rule: 'text, required, up to 100 characters' },
    { name: 'email', label: 'Email', rule: 'a valid email, required, unique among customers (the API answers 409 for a duplicate)' },
    { name: 'tier', label: 'Tier', rule: 'a select with Free, Pro and Enterprise, default Free' },
  ], 'name, email and tier', 'two customers'),
  E('product', 'products', [
    { name: 'name', label: 'Name', rule: 'text, required, up to 80 characters' },
    { name: 'price', label: 'Price', rule: 'a number with up to two decimals, greater than 0' },
    { name: 'inStock', label: 'In stock', rule: 'a checkbox, default checked' },
  ], 'name, price and an "In stock" yes/no cell', 'three products'),
  E('order', 'orders', [
    { name: 'customerName', label: 'Customer', rule: 'text, required' },
    { name: 'total', label: 'Total', rule: 'a positive number' },
    { name: 'status', label: 'Status', rule: 'a select with New, Paid and Shipped, default New' },
  ], 'customer, total and a status badge', 'two orders'),
  E('note', 'notes', [
    { name: 'title', label: 'Title', rule: 'text, required, up to 120 characters' },
    { name: 'body', label: 'Body', rule: 'a textarea, required, up to 2000 characters' },
    { name: 'pinned', label: 'Pinned', rule: 'a checkbox, default unchecked' },
  ], 'title and a "Pinned" marker', 'two notes'),
  E('tag', 'tags', [
    { name: 'name', label: 'Name', rule: 'text, required, 2 to 30 characters, unique (409 for a duplicate)' },
    { name: 'color', label: 'Colour', rule: 'a select with Red, Green and Blue' },
  ], 'name and colour', 'three tags'),
  E('article', 'articles', [
    { name: 'title', label: 'Title', rule: 'text, required, up to 150 characters' },
    { name: 'summary', label: 'Summary', rule: 'a textarea, optional, up to 300 characters' },
    { name: 'publishedAt', label: 'Published on', rule: 'a date input, optional; null when the article is a draft' },
  ], 'title and publication date ("Draft" when there is none)', 'two articles, one of them a draft'),
  E('event', 'events', [
    { name: 'name', label: 'Name', rule: 'text, required' },
    { name: 'date', label: 'Date', rule: 'a date input, required' },
    { name: 'capacity', label: 'Capacity', rule: 'a whole number from 1 to 1000' },
  ], 'name, date and capacity', 'two events'),
  E('expense', 'expenses', [
    { name: 'description', label: 'Description', rule: 'text, required, up to 200 characters' },
    { name: 'amount', label: 'Amount', rule: 'a number with up to two decimals, greater than 0' },
    { name: 'category', label: 'Category', rule: 'a select with Travel, Food and Office' },
    { name: 'spentOn', label: 'Date', rule: 'a date input, required' },
  ], 'description, amount, category and date', 'three expenses'),
  E('vehicle', 'vehicles', [
    { name: 'plate', label: 'Plate', rule: 'text, required, 4 to 10 characters, unique (409 for a duplicate)' },
    { name: 'model', label: 'Model', rule: 'text, required' },
    { name: 'mileage', label: 'Mileage', rule: 'a whole number, 0 or more' },
  ], 'plate, model and mileage', 'two vehicles'),
  E('room', 'rooms', [
    { name: 'name', label: 'Name', rule: 'text, required' },
    { name: 'floor', label: 'Floor', rule: 'a whole number from 0 to 50' },
    { name: 'hasProjector', label: 'Projector', rule: 'a checkbox, default unchecked' },
  ], 'name, floor and a projector yes/no cell', 'two rooms'),
  E('recipe', 'recipes', [
    { name: 'title', label: 'Title', rule: 'text, required' },
    { name: 'minutes', label: 'Minutes', rule: 'a whole number from 1 to 600' },
    { name: 'difficulty', label: 'Difficulty', rule: 'a select with Easy, Medium and Hard' },
    { name: 'instructions', label: 'Instructions', rule: 'a textarea, required' },
  ], 'title, minutes and difficulty', 'two recipes'),
  E('ticket', 'tickets', [
    { name: 'subject', label: 'Subject', rule: 'text, required, up to 140 characters' },
    { name: 'severity', label: 'Severity', rule: 'a select with Low, Normal and Critical, default Normal' },
    { name: 'resolved', label: 'Resolved', rule: 'a checkbox, default unchecked' },
  ], 'subject, a severity badge and a resolved marker', 'three tickets'),
];

/** Entities that belong to a task (one-to-many). */
const CHILDREN: { singular: string; plural: string; Plural: string; fields: string; where: string }[] = [
  { singular: 'comment', plural: 'comments', Plural: 'Comments', fields: '"Text" (textarea, required, up to 500 characters)', where: 'a "Comments" section under the form on the task edit page: the list of comments and a small form to add one' },
  { singular: 'subtask', plural: 'subtasks', Plural: 'Subtasks', fields: '"Title" (text, required) and a done flag that can be toggled', where: 'a "Subtasks" section on the task edit page: a checklist with a form to add a subtask' },
  { singular: 'link', plural: 'links', Plural: 'Links', fields: '"URL" (a valid URL, required) and "Label" (text, optional)', where: 'a "Links" section on the task edit page: the list of links and a form to add one' },
  { singular: 'time entry', plural: 'time-entries', Plural: 'Time entries', fields: '"Minutes" (a whole number from 1 to 1440) and "Note" (text, optional)', where: 'a "Time" section on the task edit page: the entries, their total in minutes and a form to add one' },
];

interface Spec {
  family: string;
  layer: Layer;
  work: Work;
  difficulty: 1 | 2 | 3;
  formulation: 'spec' | 'product';
  prompt: string;
  /** Hand-written Russian formulation (pool-fs-ru.ts). */
  promptRu: string;
  checks?: Check[];
  /** Planted bug: file → [from, to] replacements applied to the template. */
  setup?: Record<string, [string, string][]>;
  tag: string;
}

const fieldListRu = (e: EntitySpec) => {
  const ru = RU_ENTITIES[e.plural];
  if (!ru || ru.fields.length !== e.fields.length) throw new Error(`no Russian fields for ${e.plural}`);
  return e.fields.map((f, i) => `"${f.label}" (\`${f.name}\`: ${ru.fields[i] ?? ''})`).join('; ');
};

const fieldList = (e: EntitySpec) => e.fields.map((f) => `"${f.label}" (\`${f.name}\`: ${f.rule})`).join('; ');

const entityChecks = (plural: string): Check[] => [
  { type: 'file-exists', path: `shared/${plural}.ts` },
  { type: 'file-exists', path: `server/features/${plural}/routes.ts` },
  { type: 'file-exists', path: `server/features/${plural}/routes.test.ts` },
  { type: 'grep-count', path: 'server/app.ts', pattern: plural, min: 1 },
  { type: 'grep-count', path: 'server/db/schema.ts', pattern: 'MatchesContract', min: 2 },
  { type: 'grep-count', path: 'src/app/router.tsx', pattern: plural, min: 1 },
  { type: 'command', label: 'a new migration exists', run: '[ "$(ls drizzle/*.sql | wc -l | tr -d " ")" -ge 2 ]', expect: 'pass' },
];

function ruAt(list: string[], i: number, family: string): string {
  const text = list[i];
  if (!text) throw new Error(`no Russian text for ${family} #${String(i)}`);
  return text;
}

function specs(): Spec[] {
  const out: Spec[] = [];

  // ---------- A. new entity end to end
  for (const e of ENTITIES) {
    const ru = RU_ENTITIES[e.plural];
    if (!ru) throw new Error(`no Russian texts for ${e.plural}`);
    out.push({
      family: 'entity', layer: 'cross', work: 'create', difficulty: 3, formulation: 'spec', tag: e.plural,
      checks: entityChecks(e.plural),
      prompt: `Add ${e.Plural} end to end, following the same layering as tasks. Fields: ${fieldList(e)}. Contract in \`shared/${e.plural}.ts\`, a table with a migration and ${e.seeds} in the seed, REST routes under \`/api/${e.plural}\` (list, get, create, update, delete) with tests, RTK Query endpoints, a list page at \`${e.path}\` showing ${e.columns}, a "${e.Plural}" link in the main navigation, a form at \`${e.path}/new\` with a "Create" button that returns to the list, and web tests. Work in stages and run \`npm run verify\` after each.`,
      promptRu: `Добавь сущность ${e.Plural} (${ru.name}) под ключ, с той же раскладкой по слоям, что у задач. Поля: ${fieldListRu(e)}. Контракт в \`shared/${e.plural}.ts\`, таблица с миграцией и сиды (${ru.seeds}), REST-маршруты под \`/api/${e.plural}\` (список, получение, создание, обновление, удаление) с тестами, эндпоинты RTK Query, страница списка по адресу \`${e.path}\` с колонками: ${ru.columns}, ссылка "${e.Plural}" в главной навигации, форма по адресу \`${e.path}/new\` с кнопкой "Create", которая возвращает к списку, и веб-тесты. Работай этапами и после каждого запускай \`npm run verify\`.`,
    });
    out.push({
      family: 'entity', layer: 'cross', work: 'create', difficulty: 3, formulation: 'product', tag: e.plural,
      checks: entityChecks(e.plural),
      prompt: `We need to keep track of ${e.plural}. Users open "${e.Plural}" from the main navigation, see a table with ${e.columns}, and add a ${e.singular} on a separate page with a "Create" button that brings them back to the list. A ${e.singular} has: ${fieldList(e)}. It must be a real feature: stored in the database, served by the API, covered by tests on both sides.`,
      promptRu: `Нам нужно вести ${ru.name}. Пользователь открывает "${e.Plural}" из главной навигации, видит таблицу с колонками: ${ru.columns}, и добавляет запись на отдельной странице с кнопкой "Create", после чего возвращается к списку. Поля: ${fieldListRu(e)}. Это должна быть настоящая фича: данные лежат в базе, отдаются через API (\`/api/${e.plural}\`), страница списка по адресу \`${e.path}\`, тесты есть с обеих сторон.`,
    });
  }

  // ---------- A2. child entity of tasks
  for (const c of CHILDREN) {
    const ru = RU_CHILDREN[c.plural];
    if (!ru) throw new Error(`no Russian texts for ${c.plural}`);
    out.push({
      family: 'child', layer: 'cross', work: 'create', difficulty: 3, formulation: 'product', tag: c.plural,
      checks: [
        { type: 'grep-count', path: 'server/db/schema.ts', pattern: 'references', min: 1 },
        { type: 'grep-count', path: 'server/db/schema.ts', pattern: 'MatchesContract', min: 2 },
        { type: 'command', label: 'a new migration exists', run: '[ "$(ls drizzle/*.sql | wc -l | tr -d " ")" -ge 2 ]', expect: 'pass' },
      ],
      prompt: `Tasks need ${c.plural}. A ${c.singular} belongs to one task and has ${c.fields}. Add ${c.where}. Store them in their own table with a foreign key to the task (deleting a task deletes its ${c.plural}), serve them under \`/api/tasks/:taskId/${c.plural}\` (list and create, plus delete by id), answer 404 for an unknown task, and cover the API and the page with tests.`,
      promptRu: `Задачам нужны ${ru.name} (${c.plural}). Каждая запись принадлежит одной задаче, поля: ${ru.fields}. Добавь ${ru.where}. Храни их в отдельной таблице с внешним ключом на задачу (удаление задачи удаляет и их), отдавай через \`/api/tasks/:taskId/${c.plural}\` (список и создание, плюс удаление по id), отвечай 404 для неизвестной задачи и покрой тестами API и страницу.`,
    });
  }

  // ---------- B. a field through the whole stack (tasks). `dueDate` is a benchmark task: never here.
  const TASK_FIELDS: { name: string; label: string; rule: string; show: string }[] = [
    { name: 'estimate', label: 'Estimate (hours)', rule: 'an optional whole number from 1 to 100, null when empty', show: 'an "Estimate" column with the number or "—"' },
    { name: 'assignee', label: 'Assignee', rule: 'optional text up to 60 characters, null when empty', show: 'an "Assignee" column with the name or "Unassigned"' },
    { name: 'notes', label: 'Notes', rule: 'an optional textarea up to 300 characters, stored as an empty string when empty', show: 'nothing in the table; the notes appear only in the form' },
    { name: 'link', label: 'Link', rule: 'an optional valid URL, null when empty', show: 'a "Link" column with an anchor "Open" or "—"' },
    { name: 'archived', label: 'Archived', rule: 'a checkbox, false by default', show: 'an "Archived" badge next to the title of archived tasks' },
    { name: 'startDate', label: 'Start date', rule: 'an optional ISO date, null when empty', show: 'a "Start" column with the date or "—"' },
    { name: 'category', label: 'Category', rule: 'a select with Work, Home and Other, default Other', show: 'a "Category" column' },
    { name: 'points', label: 'Story points', rule: 'a select with 1, 2, 3, 5 and 8, stored as a number, default 1', show: 'a "Points" column' },
    { name: 'reviewerEmail', label: 'Reviewer email', rule: 'an optional valid email, null when empty', show: 'a "Reviewer" column with the email or "—"' },
    { name: 'blocked', label: 'Blocked', rule: 'a checkbox, false by default', show: 'a "Blocked" badge in the status cell of blocked tasks' },
  ];
  TASK_FIELDS.forEach((f, fi) => {
    const [ruleRu, showRu] = RU_TASK_FIELDS[fi] ?? [];
    if (!ruleRu || !showRu) throw new Error(`no Russian texts for field ${f.name}`);
    out.push({
      family: 'field', layer: 'cross', work: 'modify', difficulty: 2, formulation: 'spec', tag: 'tasks',
      checks: [
        { type: 'grep-count', path: 'shared/tasks.ts', pattern: f.name, min: 1 },
        { type: 'grep-count', path: 'server/db/schema.ts', pattern: f.name, min: 1 },
        { type: 'command', label: 'a new migration exists', run: '[ "$(ls drizzle/*.sql | wc -l | tr -d " ")" -ge 2 ]', expect: 'pass' },
      ],
      prompt: `Add a "${f.label}" field to tasks through the whole stack: \`${f.name}\` is ${f.rule}. Contract first, then the table with a migration and the seed, the API (it must reject invalid values with 400), the task form, and the tasks table: ${f.show}. Existing tasks keep working. Cover the new field in the API tests and the form tests, and update existing tests where the change requires it.`,
      promptRu: `Добавь задачам поле "${f.label}" через весь стек: \`${f.name}\`, ${ruleRu}. Сначала контракт, затем таблица с миграцией и сиды, API (некорректные значения отклоняет с кодом 400), форма задачи и таблица задач: ${showRu}. Существующие задачи продолжают работать. Покрой новое поле в тестах API и тестах формы и обнови существующие тесты там, где этого требует изменение.`,
    });
  });

  // ---------- C. API only (tasks)
  const API_TASKS: [1 | 2, Work, string][] = [
    [2, 'modify', '`GET /api/tasks` must accept an optional `status` query parameter and return only tasks with that status; an unknown status answers 400 with `{ "message": "Invalid status" }`. Filter in SQL, not in JavaScript, and cover it with API tests.'],
    [2, 'modify', '`GET /api/tasks` must accept an optional `q` query parameter and return tasks whose title contains it, case-insensitively. Do it in the SQL query and add API tests, including a query with no matches.'],
    [2, 'modify', '`GET /api/tasks` must support `sort=title`, `sort=-title`, `sort=priority` and `sort=-priority` (high first for `priority`). Without the parameter the order stays as it is. Unknown values answer 400. Add API tests.'],
    [2, 'modify', 'Add pagination to `GET /api/tasks`: optional `limit` (1 to 100) and `offset` (0 or more). Invalid values answer 400. Without them all tasks are returned. Use SQL limit and offset, and add API tests.'],
    [2, 'create', 'Add `GET /api/tasks/stats` returning `{ total, byStatus: { todo, in_progress, done } }` computed with a SQL aggregate, not by loading all rows. Register it so that it does not collide with `/:taskId`, and cover it with API tests. Put the response schema in `shared/tasks.ts`.'],
    [2, 'modify', 'Two tasks must not share a title. Add a unique index on the task title with a migration, make `POST` and `PATCH /api/tasks` answer 409 with `{ "message": "A task with this title already exists" }`, and add API tests for both.'],
    [2, 'create', 'Add `POST /api/tasks/:taskId/complete` that sets the status to `done` and returns the task; 404 for an unknown id; calling it on a done task is fine and returns the task unchanged. Cover it with API tests.'],
    [2, 'create', 'Add `DELETE /api/tasks?status=done` that removes every done task in one SQL statement and returns `{ "deleted": <count> }`. Without the `status` parameter it answers 400 and deletes nothing. Add API tests.'],
    [1, 'modify', 'The API must answer `GET /api/tasks/:taskId` for an unknown id with 404 and the body `{ "message": "Task <id> not found" }`, for example `Task 999 not found`. Update the API tests.'],
    [1, 'create', 'Add `GET /api/health` returning `{ "status": "ok", "tasks": <number of tasks> }` and an API test for it.'],
    [2, 'modify', 'Tasks need `createdAt`: an ISO timestamp set by the API on create and never changed by updates; clients cannot set it. Add it to the contract, the table with a migration (existing rows get the migration time), the seed and the API tests. The web app does not show it yet.'],
    [2, 'create', 'Add `POST /api/tasks/bulk` that accepts `{ "tasks": [...] }` with 1 to 50 task inputs, inserts them in one transaction and returns the created tasks with 201. If any item is invalid nothing is inserted and the API answers 400. Add API tests for both cases.'],
  ];
  API_TASKS.forEach(([difficulty, work, prompt], i) => {
    out.push({ family: 'api', layer: 'query', work, difficulty, formulation: 'spec', tag: 'tasks', prompt, promptRu: ruAt(RU_API, i, 'api') });
  });

  // ---------- D. web only, against the real API
  const WEB_TASKS: [1 | 2, Layer, Work, 'spec' | 'product', string][] = [
    [1, 'component', 'modify', 'spec', 'Change the heading of the tasks page to "All tasks". The navigation link keeps its text. Update existing tests if the change requires it.'],
    [1, 'component', 'modify', 'spec', 'On the tasks page, rename the button that leads to `/tasks/new` to "Add task". The "New task" link in the header stays. Update existing tests if needed.'],
    [2, 'component', 'modify', 'product', 'The tasks list is hard to scan. Add a "Search" field (with a visible label) above the table that filters rows by title as the user types, case-insensitively, and shows "No matches" when nothing matches. Add a test.'],
    [2, 'component', 'modify', 'product', 'Users want to see how much is left. Show "N of M done" under the heading of the tasks page once the tasks are loaded, and keep it correct after a task is deleted. Add a test.'],
    [2, 'query', 'modify', 'product', 'When saving a new task fails on the server nothing happens. Show "Could not save the task" above the form when the create request fails and keep the entered values. Add a test that makes `POST /api/tasks` fail with `server.use`.'],
    [2, 'routing', 'create', 'product', 'Add a details page for a task at `/tasks/:taskId`: clicking the title in the list opens it; it shows the title as the page heading, the description, the status and priority badges and an "Edit" link. An unknown id shows "Task not found". Add tests.'],
    [1, 'form', 'modify', 'spec', 'Add a "Cancel" link styled as an outline button next to the submit button of the task form, leading to `/` without saving. Add a test.'],
    [2, 'component', 'modify', 'product', 'Users want to finish a task from the list. Add a "Mark done" button (accessible name "Mark done <title>") to every row whose task is not done; it updates the task through the API and the row shows the Done badge. Done tasks have no such button. Add a test.'],
    [1, 'component', 'create', 'spec', 'Create a reusable `EmptyState` component at `src/components/empty-state.tsx` with props `title`, `description?` and `action?`, and use it on the tasks page when there are no tasks, with a link "Create the first task". Add a test.'],
    [2, 'component', 'modify', 'product', 'Add a "Sort by priority" toggle above the tasks table: high first, then medium, then low; clicking again reverses the order. Sorting happens in the browser. Add a test.'],
    [2, 'query', 'modify', 'product', 'If deleting a task fails on the server, the dialog just closes. Keep the confirmation dialog open and show "Could not delete the task" inside it; the task stays in the list. Add a test that makes the delete request fail.'],
    [1, 'routing', 'modify', 'spec', 'Visiting `/tasks` must redirect to `/`, replacing the history entry. Add it to the router configuration with a test.'],
  ];
  WEB_TASKS.forEach(([difficulty, layer, work, formulation, prompt], i) => {
    out.push({ family: 'web', layer, work, difficulty, formulation, tag: 'tasks', prompt, promptRu: ruAt(RU_WEB, i, 'web') });
  });

  // ---------- E. planted bugs across layers
  const BUGS: { prompt: string; setup: Record<string, [string, string][]>; layer: Layer; checks: Check[] }[] = [
    {
      layer: 'query',
      prompt: 'Bug report: after creating a task the list still shows the old rows until the page is reloaded. Find the cause and fix it the way the rest of the app manages its cache. Add a test that would have caught it.',
      checks: [{ type: 'grep-count', path: 'src/features/tasks/api.ts', pattern: "id: 'LIST'", min: 3 }],
      setup: { 'src/features/tasks/api.ts': [["      invalidatesTags: [{ type: 'Task', id: 'LIST' }],\n    }),\n\n    updateTask", '    }),\n\n    updateTask']] },
    },
    {
      layer: 'query',
      prompt: 'Bug report: editing a task and saving answers 200, but the task keeps its old values, even after a reload. The problem is on the server. Fix it and add an API test that would have caught it.',
      checks: [{ type: 'grep-count', path: 'server/features/tasks/routes.ts', pattern: "valid\\('json'\\)", min: 2 }],
      setup: {
        'server/features/tasks/routes.ts': [[".set(c.req.valid('json'))", ".set({ id })"]],
        'server/features/tasks/routes.test.ts': [['@@remove-test:updates part of a task', '']],
      },
    },
    {
      layer: 'form',
      prompt: 'Bug report: the API accepts a task with an empty title. `POST /api/tasks` with `{ "title": "" }` answers 201. Validation must reject it with 400 like before. Fix it and make sure a test covers it.',
      checks: [{ type: 'grep-count', path: 'server/features/tasks/routes.ts', pattern: 'zValidator\\(', min: 2 }],
      setup: {
        'server/features/tasks/routes.ts': [
          [
            "  app.post('/', zValidator('json', taskInputSchema, invalid('Invalid task')), (c) => {\n    const task = { id: crypto.randomUUID(), ...c.req.valid('json') };",
            "  app.post('/', async (c) => {\n    const body: unknown = await c.req.json();\n    const task = { ...(body as typeof tasks.$inferInsert), id: crypto.randomUUID() };",
          ],
        ],
        'server/features/tasks/routes.test.ts': [['@@remove-test:rejects an invalid task with 400 and the issues', '']],
      },
    },
    {
      layer: 'component',
      prompt: 'Bug report: every task in the list shows the "To do" badge even when it is done. Fix it and add a test for the badges.',
      checks: [{ type: 'grep-count', path: 'src/features/tasks/task-badges.tsx', pattern: 'TASK_STATUS_LABELS\\[status\\]', min: 1 }],
      setup: { 'src/features/tasks/task-badges.tsx': [['{TASK_STATUS_LABELS[status]}', '{TASK_STATUS_LABELS.todo}']] },
    },
    {
      layer: 'query',
      prompt: 'Bug report: deleting a task in the app shows an error, and the API answers 404 for ids that exist. Find the cause on the server, fix it, and make sure the API tests cover deleting an existing task.',
      checks: [{ type: 'grep-count', path: 'server/features/tasks/routes.ts', pattern: 'eq\\(tasks\\.title', max: 0 }],
      setup: {
        'server/features/tasks/routes.ts': [
          ["      .delete(tasks)\n      .where(eq(tasks.id, c.req.param('taskId')))", "      .delete(tasks)\n      .where(eq(tasks.title, c.req.param('taskId')))"],
        ],
        'server/features/tasks/routes.test.ts': [['@@remove-test:deletes a task and answers 404 afterwards', '']],
      },
    },
    {
      layer: 'routing',
      prompt: 'Bug report: the "Edit" link in every row opens the wrong task, always the first one. Fix it and add a test.',
      checks: [{ type: 'grep-count', path: 'src/features/tasks/task-list.tsx', pattern: 'tasks\\[0\\]', max: 0 }],
      setup: { 'src/features/tasks/task-list.tsx': [['<Link to={`/tasks/${task.id}/edit`}>Edit</Link>', '<Link to={`/tasks/${tasks[0]?.id ?? task.id}/edit`}>Edit</Link>']] },
    },
  ];
  BUGS.forEach((bug, i) => {
    out.push({ family: 'fix', layer: bug.layer, work: 'fix', difficulty: 2, formulation: 'product', tag: 'tasks', prompt: bug.prompt, promptRu: ruAt(RU_FIX, i, 'fix'), setup: bug.setup, checks: bug.checks });
  });

  // ---------- F. tests
  const TEST_TASKS: string[] = [
    'Extend `server/features/tasks/routes.test.ts`: a `PATCH` with an invalid status answers 400 and leaves the task unchanged; a `PATCH` for an unknown id answers 404; a `POST` with extra unknown properties still creates the task without storing them.',
    'Write `src/features/tasks/task-list.test.tsx`: it renders the given tasks with their status and priority badges, shows the empty message for an empty list, and every row has an "Edit" link pointing at that task.',
    'Add a web test with `renderApp`: open `/tasks/new`, fill in the form, submit, and assert the new task is in the list and, after rendering the app again, is still returned by `GET /api/tasks` in the same test.',
    'Add a test to the tasks page tests: when `GET /api/tasks` answers 500 the error state is shown, and after clicking "Try again" with the real API back the seeded rows appear. Use `server.use` with a one-time handler.',
    'Write `shared/tasks.test.ts` for the contract: a valid input parses; the title is trimmed; an empty or 121-character title fails with the right messages; an unknown status fails.',
    'Write API tests proving that every error body of `/api/tasks` has a `message` string: invalid JSON body, invalid fields, unknown id for GET, PATCH and DELETE, and an unknown route under `/api`.',
  ];
  TEST_TASKS.forEach((prompt, i) => out.push({ family: 'test', layer: 'test', work: 'test', difficulty: 2, formulation: 'spec', tag: 'tasks', prompt, promptRu: ruAt(RU_TEST, i, 'test') }));

  // ---------- G. configuration
  const CONFIG_TASKS: string[] = [
    'Move the task routes tests helper `json(body, method)` into `server/test-utils.ts` and reuse it; every import keeps using the `@server/` alias and all tests pass unchanged.',
    'Add an npm script `db:reset` that deletes `data/app.db` (and its `-wal`/`-shm` files) and seeds a fresh database, implemented in `server/db/reset.ts`. It must refuse to run when `NODE_ENV` is `production`.',
    'The API port and the database file are read from `PORT` and `DATABASE_FILE`. Validate the environment once in `server/env.ts` with zod (port 1 to 65535, default 3000; file default `data/app.db`) and use it in `server/index.ts` and `server/db/client.ts`. Add a test for the parser.',
    'Add request logging to the API: a Hono middleware in `server/logger.ts` that logs method, path, status and milliseconds for every request, disabled when `NODE_ENV` is `test`. Register it in `server/app.ts` and test it with a spy.',
  ];
  CONFIG_TASKS.forEach((prompt, i) => out.push({ family: 'config', layer: 'config', work: 'modify', difficulty: 2, formulation: 'spec', tag: 'tasks', prompt, promptRu: ruAt(RU_CONFIG, i, 'config') }));

  return out;
}

/** Removes one `it('<title>', ...)` block (two-space indent, closed by `  });`) so the planted bug is not caught by an existing test. */
export function removeTest(content: string, title: string, where: string): string {
  const start = content.indexOf(`  it('${title}'`);
  if (start < 0) throw new Error(`${where}: test "${title}" not found`);
  const end = content.indexOf('\n  });\n', start);
  if (end < 0) throw new Error(`${where}: end of test "${title}" not found`);
  let rest = content.slice(end + '\n  });\n'.length);
  if (rest.startsWith('\n')) rest = rest.slice(1);
  return content.slice(0, start) + rest;
}

export function generateFullstackPool(outDir: string): void {
  fs.mkdirSync(outDir, { recursive: true });
  const prefix = process.env.POOL_PREFIX ?? 'FS';
  const template = templateDir('fullstack');
  const all = specs();
  for (const spec of all) {
    for (const word of HELD_OUT) {
      if (new RegExp(`\\b${word}s?\\b`, 'i').test(spec.prompt)) throw new Error(`held-out entity "${word}" in: ${spec.prompt.slice(0, 80)}`);
    }
  }
  let written = 0;
  const coverage = new Map<string, number>();
  all.forEach((spec, i) => {
    const baseId = `${prefix}${String(i + 1).padStart(4, '0')}-${spec.family}-${spec.tag}`;
    coverage.set(`${spec.family}/d${String(spec.difficulty)}`, (coverage.get(`${spec.family}/d${String(spec.difficulty)}`) ?? 0) + 1);
    const variants: [string, string, string[]][] = [
      [baseId, spec.prompt, []],
      [`${baseId}-ru`, spec.promptRu, ['ru']],
    ];
    for (const [id, prompt, extraTags] of variants) {
      const dir = path.join(outDir, id);
      if (fs.existsSync(dir)) continue;
      fs.mkdirSync(dir, { recursive: true });
      const meta = { id, title: prompt.slice(0, 70), template: 'fullstack', layer: spec.layer, work: spec.work, difficulty: spec.difficulty, formulation: spec.formulation, tags: ['pool', 'fullstack', spec.family, spec.tag, ...extraTags] };
      fs.writeFileSync(path.join(dir, 'task.json'), JSON.stringify(meta, null, 2) + '\n');
      fs.writeFileSync(path.join(dir, 'prompt.md'), `${prompt}\n`);
      if (spec.checks) fs.writeFileSync(path.join(dir, 'checks.json'), JSON.stringify(spec.checks, null, 2) + '\n');
      if (spec.setup) {
        for (const [file, edits] of Object.entries(spec.setup)) {
          let content = fs.readFileSync(path.join(template, file), 'utf8');
          for (const [from, to] of edits) {
            if (from.startsWith('@@remove-test:')) {
              content = removeTest(content, from.slice('@@remove-test:'.length), `${id} ${file}`);
              continue;
            }
            if (!content.includes(from)) throw new Error(`${id}: planted-bug anchor not found in ${file}: ${from.slice(0, 60)}`);
            content = content.replace(from, to);
          }
          const target = path.join(dir, 'setup', file);
          fs.mkdirSync(path.dirname(target), { recursive: true });
          fs.writeFileSync(target, content);
        }
      }
      written += 1;
    }
  });
  console.log(`full-stack pool: ${String(all.length)} specs, ${String(written)} new task dirs written to ${outDir}`);
  for (const [key, count] of [...coverage].sort()) console.log(`  ${key.padEnd(14)} ${String(count)}`);
}

if (process.argv[1]?.endsWith('pool-fs.ts')) {
  generateFullstackPool(process.argv[2] ?? path.join(BENCH_DIR, 'pool-fs', 'tasks'));
}
