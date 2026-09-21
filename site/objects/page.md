# Page

`type: "page"`. A route in the app: a heading, content, a link in the main navigation. Pages are the top of the tree; everything else is reached from one.

## Keys

| Key | Type | Meaning |
|---|---|---|
| `type` | `"page"` | What this object is |
| `id` | string | Unique among pages; equals the file name `meta/pages/<id>.json` |
| `name` | string | Heading of the page and its label in the navigation. **The URL is derived from it**: `"New employee"` opens at `/new-employee` (lowercase, anything but letters and digits becomes a dash) |
| `fields` | object | Every field of the page once, keyed by its id (unique within the file). A field is either a [component](./field), `{ "type": "button", "props": { … } }`, or a reference to another object, `{ "type": "table" }`, whose meta lives in its own folder under the same id |
| `layout` | object | Where the fields go, per screen size: `desktop` (required), `tablet` and `mobile` (optional). A missing size uses the next wider one: mobile → tablet → desktop |

A layout is `{ "rows": Row[] }`, top to bottom. A **row** is `{ "columns": Column[] }`: its columns sit side by side and share the width equally. A **column** is `{ "field": "<id>" }`: one cell, one field by id. Width and alignment will be column keys.

Because the field is defined once and the layouts only point at it, a page can have a different arrangement per screen without repeating a single prop; a field left out of a layout is simply not shown on that screen.

```json
{
  "type": "page",
  "id": "employees",
  "name": "Employees",
  "fields": {
    "search": { "type": "input", "props": { "placeholder": "Search employees" } },
    "create": { "type": "button", "props": { "variant": "outline", "children": "New employee" } },
    "employees": { "type": "table" }
  },
  "layout": {
    "desktop": {
      "rows": [
        { "columns": [{ "field": "search" }, { "field": "create" }] },
        { "columns": [{ "field": "employees" }] }
      ]
    },
    "mobile": {
      "rows": [
        { "columns": [{ "field": "create" }] },
        { "columns": [{ "field": "search" }] },
        { "columns": [{ "field": "employees" }] }
      ]
    }
  }
}
```

Desktop and tablet (no `tablet` layout, so it uses desktop): search and the button on one line, the table below. Mobile: the button first, then search, then the table.

## Screen sizes

| Layout | Applies from | Tailwind |
|---|---|---|
| `mobile` | 0 | below `md` |
| `tablet` | 768px | `md` |
| `desktop` | 1024px | `lg` |

## How a page becomes a route

Nothing is generated and the router knows no page by name. `src/app/router.tsx` has the hand-written routes and then **one universal route**, `*`, handled by `src/meta/meta-route.tsx`: it takes the URL, looks for a page in `meta/pages` whose `name` maps to it, and renders that page, or the 404 page when there is none.

- `src/meta/pages.ts` loads `meta/pages/*.json` (Vite's `import.meta.glob`), validates them and answers `findPage(url)`.
- `src/meta/meta-page.tsx` renders a page: the heading, then every distinct layout once, each in a wrapper that CSS shows only on its screen sizes (`hidden lg:block` and so on), so resizing the window switches layouts without a re-render. A row is a CSS grid with one equal column per `columns` entry. A component field is the component from `src/components/ui/<type>` with `props` spread onto it and `data-meta-id` set to the field id; a reference to an object that has no renderer yet shows a placeholder in its place.
- `src/meta/nav.ts` gives the main navigation one link per page.

Add a file, and its URL answers; in `npm run dev` it appears without a restart. Delete the file, and the same URL is a 404 again.

## Checks

Meta is validated when the app loads it, and one bad file stops the app with every problem listed, so a broken page is never shown:

- `id` matches `^[a-z][a-z0-9-]*$` and equals the file name;
- `name` is 1–60 characters and yields a non-empty URL; two pages may not map to the same URL;
- `layout.desktop` is present; every row has at least one column; every placed id exists in `fields` and is placed at most once per layout;
- a component `type` is a folder in `src/components/ui` whose main export is its PascalCase name.

`props` are not checked against the component here: they reach it as they are. One test, `src/meta/meta-page.test.tsx`, opens every page at its URL and expects the heading and each field, so `npm run verify` still covers every page in meta.

::: warning Props are unchecked at load
With generated code, `tsc` rejected a prop the component did not accept. With meta read at runtime that check is gone; a typo in a prop reaches the DOM as an unknown attribute. A check against the component types is on the roadmap.
:::

::: info Draft
More keys to be added.
:::
