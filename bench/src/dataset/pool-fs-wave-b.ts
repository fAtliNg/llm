import fs from 'node:fs';
import path from 'node:path';

import { BENCH_DIR } from '../paths.ts';
import type { Check, Layer, Work } from '../types.ts';
import { duplicateMessage, names, type GenEntity, type GenField } from './entity-codegen.ts';
import { GEN_ENTITIES } from './pool-fs-entities.ts';
import { HELD_OUT, removeTest } from './pool-fs.ts';

/**
 * Second wave of the full-stack pool: stage 2 tasks on entities that already exist in the project.
 * The starting project of every task is a generated and verified feature from `pool-fs/setups`
 * (run pool-fs-setups.ts first). Every task is written in English and in Russian with the same
 * setup and checks. Prefix `FB`. Usage: node src/dataset/pool-fs-wave-b.ts [outDir]
 */
interface Spec {
  family: string;
  entity: GenEntity;
  layer: Layer;
  work: Work;
  en: string;
  ru: string;
  checks?: Check[];
  /** Changes the starting project: planted bugs. */
  plant?: (files: Map<string, string>) => void;
}

const SETUPS = path.join(BENCH_DIR, 'pool-fs', 'setups');
const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const lower = (f: GenField) => f.label.toLowerCase();

/** One extra field per entity for the "add a field to an existing entity" family. */
const EXTRA_FIELDS: Record<string, { name: string; en: string; ru: string }> = {
  customers: { name: 'phone', en: '"Phone" (`phone`): optional text up to 30 characters, null when empty; the table gets a "Phone" column with the number or "—"', ru: '"Phone" (`phone`): необязательный текст до 30 символов, null если пусто; в таблице появляется колонка "Phone" с номером или "—"' },
  products: { name: 'sku', en: '"SKU" (`sku`): required text from 3 to 20 characters, unique among products (the API answers 409 with `{ "message": "A product with this SKU already exists" }`); existing products get `SKU-1`, `SKU-2` and so on in the seed; the table gets a "SKU" column', ru: '"SKU" (`sku`): обязательный текст от 3 до 20 символов, уникален среди товаров (API отвечает 409 с `{ "message": "A product with this SKU already exists" }`); существующие товары получают в сидах `SKU-1`, `SKU-2` и так далее; в таблице появляется колонка "SKU"' },
  orders: { name: 'note', en: '"Note" (`note`): an optional textarea up to 300 characters, stored as an empty string when empty; it appears only in the form', ru: '"Note" (`note`): необязательная textarea до 300 символов, при пустом значении хранится пустая строка; видна только в форме' },
  notes: { name: 'color', en: '"Colour" (`color`): a select with Yellow, Blue and Green stored as `yellow`, `blue`, `green`, default Yellow; the table gets a "Colour" column', ru: '"Colour" (`color`): селект с вариантами Yellow, Blue и Green, хранится как `yellow`, `blue`, `green`, по умолчанию Yellow; в таблице появляется колонка "Colour"' },
  tags: { name: 'description', en: '"Description" (`description`): optional text up to 100 characters, stored as an empty string when empty; the table gets a "Description" column', ru: '"Description" (`description`): необязательный текст до 100 символов, при пустом значении хранится пустая строка; в таблице появляется колонка "Description"' },
  articles: { name: 'author', en: '"Author" (`author`): required text up to 80 characters, message "Author is required"; existing articles get "Unknown"; the table gets an "Author" column', ru: '"Author" (`author`): обязательный текст до 80 символов, сообщение "Author is required"; существующие статьи получают "Unknown"; в таблице появляется колонка "Author"' },
  events: { name: 'location', en: '"Location" (`location`): required text up to 120 characters, message "Location is required"; existing events get "TBD"; the table gets a "Location" column', ru: '"Location" (`location`): обязательный текст до 120 символов, сообщение "Location is required"; существующие события получают "TBD"; в таблице появляется колонка "Location"' },
  expenses: { name: 'reimbursed', en: '"Reimbursed" (`reimbursed`): a checkbox, false by default; the table gets a "Reimbursed" column with Yes or No', ru: '"Reimbursed" (`reimbursed`): чекбокс, по умолчанию false; в таблице появляется колонка "Reimbursed" со значениями Yes или No' },
  vehicles: { name: 'year', en: '"Year" (`year`): a whole number from 1990 to 2030; existing vehicles get 2020; the table gets a "Year" column', ru: '"Year" (`year`): целое число от 1990 до 2030; существующие автомобили получают 2020; в таблице появляется колонка "Year"' },
  rooms: { name: 'capacity', en: '"Capacity" (`capacity`): a whole number from 1 to 200; existing rooms get 10; the table gets a "Capacity" column', ru: '"Capacity" (`capacity`): целое число от 1 до 200; существующие переговорные получают 10; в таблице появляется колонка "Capacity"' },
  recipes: { name: 'servings', en: '"Servings" (`servings`): a whole number from 1 to 20; existing recipes get 2; the table gets a "Servings" column', ru: '"Servings" (`servings`): целое число от 1 до 20; существующие рецепты получают 2; в таблице появляется колонка "Servings"' },
  tickets: { name: 'assignee', en: '"Assignee" (`assignee`): optional text up to 60 characters, null when empty; the table gets an "Assignee" column with the name or "Unassigned"', ru: '"Assignee" (`assignee`): необязательный текст до 60 символов, null если пусто; в таблице появляется колонка "Assignee" с именем или "Unassigned"' },
};

function specs(): Spec[] {
  const out: Spec[] = [];
  for (const e of GEN_ENTITIES) {
    const n = names(e);
    const k = kebab(n.plural);
    const first = e.fields[0];
    if (!first) continue;
    const nameOf = `<${lower(first)}>`;
    const intro = { en: `The app already has ${n.Plural} at \`/${k}\` with an API under \`/api/${k}\`.`, ru: `В приложении уже есть раздел "${n.Plural}" по адресу \`/${k}\` с API под \`/api/${k}\`.` };

    out.push({
      family: 'edit', entity: e, layer: 'cross', work: 'modify',
      checks: [
        { type: 'grep-count', path: 'src/app/router.tsx', pattern: '/edit', min: 2 },
        { type: 'grep-count', path: `src/features/${k}/api.ts`, pattern: 'invalidatesTags', min: 3 },
      ],
      en: `${intro.en} ${n.Plural} can be created but not changed. Add an "Edit" link to every row (accessible name "Edit ${nameOf}") opening \`/${k}/:${n.idParam}/edit\`: a page with the heading "Edit ${n.singular}", the form filled with the current values and a "Save" button that returns to the list; an unknown id shows "${n.Singular} not found". Add a "Delete" button to every row (accessible name "Delete ${nameOf}") behind a confirmation dialog titled "Delete ${n.singular}?", the same way tasks are deleted. The API already supports both. Add tests.`,
      ru: `${intro.ru} Записи можно создавать, но нельзя менять. Добавь в каждую строку ссылку "Edit" (accessible name "Edit ${nameOf}"), которая открывает \`/${k}/:${n.idParam}/edit\`: страница с заголовком "Edit ${n.singular}", формой с текущими значениями и кнопкой "Save", которая возвращает к списку; для неизвестного id показывается "${n.Singular} not found". Добавь в каждую строку кнопку "Delete" (accessible name "Delete ${nameOf}") с диалогом подтверждения с заголовком "Delete ${n.singular}?", так же, как удаляются задачи. API уже умеет и то и другое. Добавь тесты.`,
    });

    out.push({
      family: 'search', entity: e, layer: 'cross', work: 'modify',
      checks: [{ type: 'grep-count', path: `server/features/${k}/routes.ts`, pattern: 'like\\(|sql`', min: 1 }],
      en: `${intro.en} The list is getting long. Add a field labelled "Search" above the table: the list shows only the ${n.plural} whose ${lower(first)} contains the text, case-insensitively, and "No matches" when there are none. The search must happen on the server: \`GET /api/${k}?q=...\` filters in SQL, and without the parameter everything is returned. Add tests on both sides.`,
      ru: `${intro.ru} Список стал длинным. Добавь над таблицей поле с подписью "Search": в списке остаются только записи, у которых ${f2ru(first)} содержит введённый текст без учёта регистра, а если таких нет, показывается "No matches". Поиск выполняется на сервере: \`GET /api/${k}?q=...\` фильтрует в SQL, без параметра возвращается всё. Добавь тесты с обеих сторон.`,
    });

    for (const f of e.fields) {
      if (f.kind === 'enum') {
        out.push({
          family: 'filter', entity: e, layer: 'cross', work: 'modify',
          checks: [{ type: 'grep-count', path: `server/features/${k}/routes.ts`, pattern: 'query', min: 1 }],
          en: `${intro.en} Add a select labelled "Filter by ${lower(f)}" above the table with "All" chosen by default and one option per ${lower(f)} (${f.options.map(([, l]) => l).join(', ')}). Picking one shows only matching ${n.plural}; "All" shows everything again. The filtering happens on the server: \`GET /api/${k}?${f.name}=${f.options[1]?.[0] ?? ''}\` returns only those, without the parameter everything is returned, and an unknown value answers 400 with \`{ "message": "Invalid ${lower(f)}" }\`. Add tests on both sides.`,
          ru: `${intro.ru} Добавь над таблицей селект с подписью "Filter by ${lower(f)}", где по умолчанию выбрано "All", а остальные варианты это значения поля (${f.options.map(([, l]) => l).join(', ')}). При выборе значения остаются только подходящие записи; "All" снова показывает все. Фильтрация выполняется на сервере: \`GET /api/${k}?${f.name}=${f.options[1]?.[0] ?? ''}\` возвращает только их, без параметра возвращается всё, а неизвестное значение даёт 400 с \`{ "message": "Invalid ${lower(f)}" }\`. Добавь тесты с обеих сторон.`,
        });
        out.push({
          family: 'stats', entity: e, layer: 'cross', work: 'create',
          checks: [{ type: 'grep-count', path: `server/features/${k}/routes.ts`, pattern: 'stats', min: 1 }],
          en: `${intro.en} Add \`GET /api/${k}/stats\` returning \`{ "total": <count>, "by${cap(f.name)}": { ${f.options.map(([v]) => `"${v}": <count>`).join(', ')} } }\`, computed with a SQL aggregate rather than by loading every row, and registered so that it does not collide with \`/:${n.idParam}\`. Put the response schema next to the contract in \`shared/${k}.ts\`. Show the numbers above the table as one line, for example "${f.options.map(([, l]) => `${l}: 1`).join(' · ')}", and keep it correct after a new ${n.singular} is created. Add tests on both sides.`,
          ru: `${intro.ru} Добавь \`GET /api/${k}/stats\`, который возвращает \`{ "total": <count>, "by${cap(f.name)}": { ${f.options.map(([v]) => `"${v}": <count>`).join(', ')} } }\`; числа считаются SQL-агрегатом, а не загрузкой всех строк, а маршрут зарегистрирован так, чтобы не конфликтовать с \`/:${n.idParam}\`. Схему ответа положи рядом с контрактом в \`shared/${k}.ts\`. Покажи числа над таблицей одной строкой, например "${f.options.map(([, l]) => `${l}: 1`).join(' · ')}", и чтобы строка оставалась верной после создания новой записи. Добавь тесты с обеих сторон.`,
        });
      }
      if (f.kind === 'bool') {
        out.push({
          family: 'boolfilter', entity: e, layer: 'cross', work: 'modify',
          checks: [{ type: 'grep-count', path: `server/features/${k}/routes.ts`, pattern: 'query', min: 1 }],
          en: `${intro.en} Add a checkbox labelled "Only ${lower(f)}" above the table. When it is checked the list shows only the ${n.plural} where "${f.label}" is set. The filtering happens on the server: \`GET /api/${k}?${f.name}=true\` returns only those, \`${f.name}=false\` only the others, without the parameter everything; any other value answers 400 with \`{ "message": "Invalid ${f.name}" }\`. Add tests on both sides.`,
          ru: `${intro.ru} Добавь над таблицей чекбокс с подписью "Only ${lower(f)}". Когда он отмечен, в списке остаются только записи, у которых установлено "${f.label}". Фильтрация выполняется на сервере: \`GET /api/${k}?${f.name}=true\` возвращает только их, \`${f.name}=false\` только остальные, без параметра всё; любое другое значение даёт 400 с \`{ "message": "Invalid ${f.name}" }\`. Добавь тесты с обеих сторон.`,
        });
      }
      if (f.kind === 'int' || f.kind === 'money') {
        out.push({
          family: 'sort', entity: e, layer: 'cross', work: 'modify',
          checks: [{ type: 'grep-count', path: `server/features/${k}/routes.ts`, pattern: 'orderBy', min: 1 }],
          en: `${intro.en} Add a select labelled "Sort by" above the table with the options "Default", "${f.label} ascending" and "${f.label} descending". The sorting happens on the server: \`GET /api/${k}?sort=${f.name}\` and \`?sort=-${f.name}\` order in SQL, without the parameter the order stays as it is, and any other value answers 400 with \`{ "message": "Invalid sort" }\`. Add tests on both sides.`,
          ru: `${intro.ru} Добавь над таблицей селект с подписью "Sort by" и вариантами "Default", "${f.label} ascending" и "${f.label} descending". Сортировка выполняется на сервере: \`GET /api/${k}?sort=${f.name}\` и \`?sort=-${f.name}\` упорядочивают в SQL, без параметра порядок остаётся прежним, а любое другое значение даёт 400 с \`{ "message": "Invalid sort" }\`. Добавь тесты с обеих сторон.`,
        });
      }
      if ((f.kind === 'text' || f.kind === 'email') && f.unique) {
        out.push({
          family: 'conflict', entity: e, layer: 'form', work: 'modify',
          checks: [{ type: 'grep-count', path: `src/features/${k}/${kebab(n.singular)}-form.tsx`, pattern: 'setError', min: 1 }],
          en: `${intro.en} When someone creates ${/^[aeiou]/.test(n.singular) ? 'an' : 'a'} ${n.singular} with ${/^[aeiou]/.test(lower(f)) ? 'an' : 'a'} ${lower(f)} that is already taken, the API answers 409 but the page shows nothing. Stay on the form, keep the entered values and show the message from the API, "${duplicateMessage(e, f)}", under the ${f.label} field. Do not hard-code the text in the web app: take it from the response. Add a test.`,
          ru: `${intro.ru} Когда кто-то создаёт запись с уже занятым значением поля "${f.label}", API отвечает 409, но на странице ничего не происходит. Оставайся на форме, сохрани введённые значения и покажи под полем ${f.label} сообщение от API: "${duplicateMessage(e, f)}". Не зашивай текст в веб-приложение: бери его из ответа. Добавь тест.`,
        });
      }
    }

    const extra = EXTRA_FIELDS[e.plural];
    if (extra) {
      out.push({
        family: 'field', entity: e, layer: 'cross', work: 'modify',
        checks: [
          { type: 'grep-count', path: `shared/${k}.ts`, pattern: extra.name, min: 1 },
          { type: 'grep-count', path: 'server/db/schema.ts', pattern: extra.name, min: 1 },
          { type: 'command', label: 'a new migration exists', run: '[ "$(ls drizzle/*.sql | wc -l | tr -d " ")" -ge 3 ]', expect: 'pass' },
        ],
        en: `${intro.en} Add a field to ${n.plural} through the whole stack. ${extra.en}. Contract first, then the table with a migration and the seed, the API (invalid values answer 400), the form and the table. Existing ${n.plural} keep working. Cover the field in the API tests and the form tests, and update existing tests where the change requires it.`,
        ru: `${intro.ru} Добавь поле через весь стек. ${extra.ru}. Сначала контракт, затем таблица с миграцией и сиды, API (некорректные значения дают 400), форма и таблица. Существующие записи продолжают работать. Покрой поле в тестах API и тестах формы и обнови существующие тесты там, где этого требует изменение.`,
      });
    }

    // ---------- planted bugs
    const article = /^[aeiou]/.test(n.singular) ? 'an' : 'a';
    out.push({
      family: 'fix-cache', entity: e, layer: 'query', work: 'fix',
      checks: [{ type: 'grep-count', path: `src/features/${k}/api.ts`, pattern: "id: 'LIST'", min: 2 }],
      plant: (files) => {
        edit(files, `src/features/${k}/api.ts`, (s) => cut(s, `      invalidatesTags: [{ type: '${n.Singular}', id: 'LIST' }],\n`));
        edit(files, `src/pages/${k}-page.test.tsx`, (s) => removeTest(s, `creates ${article} ${n.singular} and returns to the list`, k));
      },
      en: `Bug report: after creating ${article} ${n.singular} the list at \`/${k}\` still shows the old rows until the page is reloaded. Find the cause and fix it the way the rest of the app manages its cache. Add a test that would have caught it.`,
      ru: `Баг-репорт: после создания записи в разделе "${n.Plural}" список по адресу \`/${k}\` показывает старые строки, пока не перезагрузишь страницу. Найди причину и почини так, как в остальном приложении принято работать с кэшем. Добавь тест, который поймал бы эту ошибку.`,
    });
    out.push({
      family: 'fix-delete', entity: e, layer: 'query', work: 'fix',
      checks: [{ type: 'grep-count', path: `server/features/${k}/routes.ts`, pattern: `eq\\(${n.plural}\\.${first.name}, c\\.req\\.param`, max: 0 }],
      plant: (files) => {
        edit(files, `server/features/${k}/routes.ts`, (s) => {
          const at = s.indexOf('.delete(');
          const target = `eq(${n.plural}.id, c.req.param('${n.idParam}'))`;
          const where = s.indexOf(target, at);
          if (at < 0 || where < 0) throw new Error(`${k}: delete anchor not found`);
          return s.slice(0, where) + `eq(${n.plural}.${first.name}, c.req.param('${n.idParam}'))` + s.slice(where + target.length);
        });
        edit(files, `server/features/${k}/routes.test.ts`, (s) => removeTest(s, `updates and deletes ${article} ${n.singular}, 404 for unknown ids`, k));
      },
      en: `Bug report: \`DELETE /api/${k}/:${n.idParam}\` answers 404 for ids that exist, so nothing can be removed. Find the cause on the server, fix it, and make sure the API tests cover updating and deleting an existing ${n.singular} and the 404 for an unknown id.`,
      ru: `Баг-репорт: \`DELETE /api/${k}/:${n.idParam}\` отвечает 404 для существующих id, поэтому ничего нельзя удалить. Найди причину на сервере, почини и убедись, что тесты API покрывают обновление и удаление существующей записи и 404 для неизвестного id.`,
    });
    const second = e.fields.find((f) => f.name === e.columns[1]);
    if (second?.kind === 'enum') {
      // Repeating the first column would leave the labels import unused; show one fixed label instead.
      const [firstValue, firstLabel] = second.options[0] ?? ['', ''];
      const lookup = `[${n.singular}.${second.name}]`;
      out.push({
        family: 'fix-column', entity: e, layer: 'component', work: 'fix',
        checks: [{ type: 'grep-count', path: `src/features/${k}/${kebab(n.singular)}-list.tsx`, pattern: `\\[${n.singular}\\.${second.name}\\]`, min: 1 }],
        plant: (files) => {
          edit(files, `src/features/${k}/${kebab(n.singular)}-list.tsx`, (s) => s.replace(lookup, `.${firstValue}`));
          edit(files, `src/pages/${k}-page.test.tsx`, (s) => removeTest(s, `lists the ${n.plural} from the API`, k));
        },
        en: `Bug report: in the table at \`/${k}\` every row shows "${firstLabel}" in the "${second.label}" column, whatever the real ${lower(second)} is. Fix it and add a test for the row contents.`,
        ru: `Баг-репорт: в таблице по адресу \`/${k}\` у каждой строки в колонке "${second.label}" стоит "${firstLabel}", каким бы ни было настоящее значение. Почини и добавь тест на содержимое строки.`,
      });
    } else if (second) {
      out.push({
        family: 'fix-column', entity: e, layer: 'component', work: 'fix',
        checks: [{ type: 'grep-count', path: `src/features/${k}/${kebab(n.singular)}-list.tsx`, pattern: `${n.singular}\\.${second.name}`, min: 1 }],
        plant: (files) => {
          edit(files, `src/features/${k}/${kebab(n.singular)}-list.tsx`, (s) => {
            const cells = [...s.matchAll(/<TableCell[^>]*>([\s\S]*?)<\/TableCell>/g)];
            const [a, b] = cells;
            if (!a?.[1] || !b?.[1] || b.index === undefined) throw new Error(`${k}: table cells not found`);
            const replaced = b[0].replace(b[1], a[1]);
            return s.slice(0, b.index) + replaced + s.slice(b.index + b[0].length);
          });
          edit(files, `src/pages/${k}-page.test.tsx`, (s) => removeTest(s, `lists the ${n.plural} from the API`, k));
        },
        en: `Bug report: in the table at \`/${k}\` the "${second.label}" column repeats the ${lower(first)} instead of showing the ${lower(second)}. Fix it and add a test for the row contents.`,
        ru: `Баг-репорт: в таблице по адресу \`/${k}\` колонка "${second.label}" повторяет значение первой колонки ("${first.label}") вместо своего. Почини и добавь тест на содержимое строки.`,
      });
    }
  }
  return out;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** Russian wording for "whose <field> contains": the field is named by its English label. */
const f2ru = (f: GenField) => `поле "${f.label}"`;

function edit(files: Map<string, string>, file: string, change: (content: string) => string): void {
  const content = files.get(file);
  if (content === undefined) throw new Error(`setup file missing: ${file}`);
  const next = tidy(change(content));
  if (next === content) throw new Error(`planted bug did not change ${file}`);
  files.set(file, next);
}

/** Removing a test may leave a blank line before the closing brace and an unused import. */
function tidy(content: string): string {
  let next = content.replace(/\n\n(\}\);\n)$/, '\n$1');
  if (!next.includes('within(')) next = next.replace('import { screen, within }', 'import { screen }');
  return next;
}

function cut(content: string, fragment: string): string {
  if (!content.includes(fragment)) throw new Error(`fragment not found: ${fragment.slice(0, 50)}`);
  return content.replace(fragment, '');
}

function readSetup(plural: string): Map<string, string> {
  const root = path.join(SETUPS, plural);
  if (!fs.existsSync(root)) throw new Error(`no setup for ${plural}: run pool-fs-setups.ts first`);
  const files = new Map<string, string>();
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(rel);
      else files.set(rel, fs.readFileSync(path.join(root, rel), 'utf8'));
    }
  };
  walk('');
  return files;
}

export function generateWaveB(outDir: string): void {
  fs.mkdirSync(outDir, { recursive: true });
  const all = specs();
  let written = 0;
  const coverage = new Map<string, number>();
  all.forEach((spec, i) => {
    for (const word of HELD_OUT) {
      if (new RegExp(`\\b${word}s?\\b`, 'i').test(spec.en)) throw new Error(`held-out entity "${word}" in: ${spec.en.slice(0, 80)}`);
    }
    coverage.set(spec.family, (coverage.get(spec.family) ?? 0) + 1);
    const files = readSetup(spec.entity.plural);
    spec.plant?.(files);
    const baseId = `FB${String(i + 1).padStart(4, '0')}-${spec.family}-${spec.entity.plural}`;
    for (const [id, prompt, extraTags] of [
      [baseId, spec.en, []],
      [`${baseId}-ru`, spec.ru, ['ru']],
    ] as [string, string, string[]][]) {
      const dir = path.join(outDir, id);
      if (fs.existsSync(dir)) continue;
      fs.mkdirSync(dir, { recursive: true });
      const meta = {
        id, title: prompt.slice(0, 70), template: 'fullstack', layer: spec.layer, work: spec.work, difficulty: 2,
        formulation: spec.work === 'fix' ? 'product' : 'spec',
        tags: ['pool', 'fullstack', 'wave-b', spec.family, spec.entity.plural, ...extraTags],
      };
      fs.writeFileSync(path.join(dir, 'task.json'), JSON.stringify(meta, null, 2) + '\n');
      fs.writeFileSync(path.join(dir, 'prompt.md'), `${prompt}\n`);
      if (spec.checks) fs.writeFileSync(path.join(dir, 'checks.json'), JSON.stringify(spec.checks, null, 2) + '\n');
      for (const [file, content] of files) {
        const target = path.join(dir, 'setup', file);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, content);
      }
      written += 1;
    }
  });
  console.log(`wave B: ${String(all.length)} specs, ${String(written)} new task dirs written to ${outDir}`);
  for (const [key, count] of [...coverage].sort()) console.log(`  ${key.padEnd(14)} ${String(count)}`);
}

if (process.argv[1]?.endsWith('pool-fs-wave-b.ts')) {
  generateWaveB(process.argv[2] ?? path.join(BENCH_DIR, 'pool-fs', 'tasks'));
}
