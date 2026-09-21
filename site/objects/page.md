# Page

`type: "page"`. A route in the app: a heading, content, a link in the main navigation. Pages are the top of the tree; everything else is reached from one.

## Keys

| Key | Type | Meaning |
|---|---|---|
| `type` | `"page"` | What this object is |
| `id` | string | Unique among pages; equals the file name `meta/pages/<id>.json` |
| `name` | string | Heading of the page and its label in the navigation. **The URL is derived from it**: `"New employee"` opens at `/new-employee` (lowercase, anything but letters and digits becomes a dash) |
| `rows` | Row[] | The content as a grid, top to bottom |

A **row** is `{ "columns": Column[] }`: its columns sit side by side, left to right, and share the width equally. A **column** is `{ "field": Field }`: one cell, one field. The field is either a [component](./field) (`type` is a component name) or a reference to another object, `{ "type": "table", "id": "employees" }`, whose own meta lives in its folder. This is how fields get their position; width and alignment will be column keys.

```json
{
  "type": "page",
  "id": "employees",
  "name": "Employees",
  "rows": [
    {
      "columns": [
        { "field": { "type": "input", "id": "search", "props": { "placeholder": "Search employees" } } },
        { "field": { "type": "button", "id": "create", "props": { "variant": "outline", "children": "New employee" } } }
      ]
    },
    { "columns": [{ "field": { "type": "table", "id": "employees" } }] }
  ]
}
```

Rendered: the search input and the button on one line, half the width each; the table below, full width.

## How a page becomes a route

Nothing is generated and the router knows no page by name. `src/app/router.tsx` has the hand-written routes and then **one universal route**, `*`, handled by `src/meta/meta-route.tsx`: it takes the URL, looks for a page in `meta/pages` whose `name` maps to it, and renders that page, or the 404 page when there is none.

- `src/meta/pages.ts` loads `meta/pages/*.json` (Vite's `import.meta.glob`), validates them and answers `findPage(url)`.
- `src/meta/meta-page.tsx` renders a page: the heading, then the rows; each row is a CSS grid with one equal column per `columns` entry. A component field is the component from `src/components/ui/<type>` with `props` spread onto it and `data-meta-id` set to the field id; a reference to an object that has no renderer yet shows a placeholder in its place.
- `src/meta/nav.ts` gives the main navigation one link per page.

Add a file, and its URL answers; in `npm run dev` it appears without a restart. Delete the file, and the same URL is a 404 again.

## Checks

Meta is validated when the app loads it, and one bad file stops the app with every problem listed, so a broken page is never shown:

- `id` matches `^[a-z][a-z0-9-]*$` and equals the file name;
- `name` is 1–60 characters and yields a non-empty URL; two pages may not map to the same URL;
- every row has at least one column; field ids are unique within the page;
- a component `type` is a folder in `src/components/ui` whose main export is its PascalCase name.

`props` are not checked against the component here: they reach it as they are. One test, `src/meta/meta-page.test.tsx`, opens every page at its URL and expects the heading and each field, so `npm run verify` still covers every page in meta.

::: warning Props are unchecked at load
With generated code, `tsc` rejected a prop the component did not accept. With meta read at runtime that check is gone; a typo in a prop reaches the DOM as an unknown attribute. A check against the component types is on the roadmap.
:::

::: info Draft
More keys to be added.
:::
