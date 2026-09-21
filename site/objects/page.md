# Page

`type: "page"`. A route in the app: a heading, content, a link in the main navigation. Pages are the top of the tree; everything else is reached from one.

## Keys

| Key | Type | Meaning |
|---|---|---|
| `type` | `"page"` | What this object is |
| `id` | string | Unique among pages; equals the file name `meta/pages/<id>.json` |
| `name` | string | Heading of the page and its label in the navigation. **The URL is derived from it**: `"New employee"` opens at `/new-employee` (lowercase, anything but letters and digits becomes a dash) |
| `layout` | string | Optional: the [layout](./layout) (frame) the page is shown in, by id from `meta/layouts`. Without it the page stands alone |
| `section` | string | Optional: a group name for navigation (`"Guide"`, `"Objects"`); a `nav` field can show one section, or one link per section |
| `order` | number | Optional: position in navigation and in previous/next, lowest first; pages without it follow, by name |
| `heading` | boolean | Default `true`: the page draws `name` as its heading. Set `false` when the page draws its own title |
| `background` | string | Optional: background of the whole page, any CSS value |
| `fields` | object | Every field of the page once, keyed by its id (unique within the file). A field is either a [component](./field), `{ "type": "button", "props": { … } }`, or a reference to another object, `{ "type": "table" }`, whose meta lives in its own folder under the same id |
| `grid` | object | Where the fields go, per screen size: `desktop` (required), `tablet` and `mobile` (optional). A missing size uses the next wider one: mobile → tablet → desktop |

A grid is `{ "rows": Row[] }`, top to bottom. A **row** is `{ "columns": Column[] }`: its columns sit side by side and share the width equally. A **column** is `{ "field": "<id>" }`: one cell, one field by id. Both take the optional box keys below.

### Row and column keys

| Key | Type | On a row | On a column |
|---|---|---|---|
| `align` | `"left"` \| `"center"` \| `"right"` | Horizontal alignment of content in every cell | The same for this cell; overrides the row |
| `valign` | `"top"` \| `"middle"` \| `"bottom"` | Vertical alignment of content in every cell | The same for this cell; overrides the row |
| `margin` | number \| string | Space around the row | Space around the cell |
| `padding` | number \| string | Space inside the row, around all cells | Space inside the cell |
| `background` | string | Background of the row | Background of the cell |
| `border` | object | `{ "top", "right", "bottom", "left" }`, each any CSS border (`"1px solid var(--border)"`) | The same for the cell |
| `height` | number \| string | Height of the row | Height of the cell |
| `maxWidth` | number \| string | Max width of the row; with `"margin": "0 auto"` it is centred | The same for the cell |
| `sticky` | boolean | The row stays in view while the page scrolls (a header) | The cell stays in view (a sidebar, an outline) |
| `top` | number \| string | Offset from the top of the window for `sticky`, default 0 | The same; for a sidebar under a 64px header, `64` |
| `scroll` | boolean | Content taller than `height` scrolls inside | The same |
| `gap` | number \| string | Space between the columns, default 16 | — |
| `width` | string | — | Any CSS grid track size: `"240px"`, `"25%"`, `"auto"`, `"minmax(0, 688px)"`. Columns without it share what is left equally |

All optional. A cell lays its content out as a column: without `align`/`valign` the content stretches to the cell, which is what inputs and textareas want; with `height` on the cell, `valign` centres the content inside it; set them for things with a natural size, like a badge, a switch or a button. A number is pixels on every side; a string is any CSS value (`"8px 16px"`, `"1rem 0 0"`). `background` is any CSS background: a [theme token](./theme) (`"$muted"`, which follows the active theme), a colour, a gradient.

```json
{ "valign": "middle", "columns": [{ "field": "email" }, { "field": "status", "align": "left" }] }
```
```json
{ "align": "right", "margin": "16px 0 0", "columns": [{ "field": "save", "align": "left" }, { "field": "cancel" }] }
```

A sticky header row and a sticky, scrolling sidebar column, as in a documentation site:

```json
{ "sticky": true, "top": 0, "height": 64, "background": "$background", "border": { "bottom": "1px solid $border" }, "columns": [{ "field": "header" }] }
```
```json
{ "field": "sidebar", "width": "272px", "sticky": true, "top": 64, "height": "calc(100vh - 64px)", "scroll": true }
```



Because the field is defined once and the grids only point at it, a page can have a different arrangement per screen without repeating a single prop; a field left out of a grid is simply not shown on that screen.

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
  "grid": {
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

Desktop and tablet (no `tablet` grid, so it uses desktop): search and the button on one line, the table below. Mobile: the button first, then search, then the table.

## Screen sizes

| Grid | Applies from | Tailwind |
|---|---|---|
| `mobile` | 0 | below `md` |
| `tablet` | 768px | `md` |
| `desktop` | 1024px | `lg` |

## How a page becomes a route

Nothing is generated and the router knows no page by name. `src/app/router.tsx` has **one universal route**, `*`, handled by `src/meta/meta-route.tsx`: it takes the URL, looks for a page in `meta/pages` whose `name` maps to it, and renders that page, or the 404 page when there is none. The root URL `/` opens the first page in the navigation (file order). There are no hand-written pages: what is in `meta/pages` is the app.

- `src/meta/load.ts` loads `meta/pages/*.json` and `meta/layouts/*.json` (Vite's `import.meta.glob`), validates them and answers `findPage(url)` and `layoutChain(page)`.
- `src/meta/meta-page.tsx` renders a page: the heading, then the grid for the current screen size (`useDevice`, a `matchMedia` hook; crossing a breakpoint re-renders). A row is a CSS grid, columns sized by `width` or equal. A component field is the component from `src/components/ui/<type>` with `props` spread onto it and `data-meta-id` set to the field id; a reference to an object that has no renderer yet shows a placeholder in its place.
- `src/meta/meta-route.tsx` wraps the page in its layouts, innermost first; `src/meta/nav.tsx` is the built-in `nav` field.

Add a file, and its URL answers; in `npm run dev` it appears without a restart. Delete the file, and the same URL is a 404 again.

## Checks

Meta is validated when the app loads it, and one bad file stops the app with every problem listed, so a broken page is never shown:

- `id` matches `^[a-z][a-z0-9-]*$` and equals the file name;
- `name` is 1–60 characters and yields a non-empty URL; two pages may not map to the same URL;
- `grid.desktop` is present; every row has at least one column; every placed id exists in `fields` and is placed at most once per grid; a `children` field is not allowed on a page;
- a component `type` is a folder in `src/components/ui` whose main export is its PascalCase name.

`props` are not checked against the component here: they reach it as they are. One test, `src/meta/meta-page.test.tsx`, opens every page at its URL and expects the heading and each field, so `npm run verify` still covers every page in meta.

::: warning Props are unchecked at load
With generated code, `tsc` rejected a prop the component did not accept. With meta read at runtime that check is gone; a typo in a prop reaches the DOM as an unknown attribute. A check against the component types is on the roadmap.
:::

::: info Draft
More keys to be added.
:::
