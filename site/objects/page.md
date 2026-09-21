# Page

`type: "page"`. A route in the app: a heading, content, a link in the main navigation. Pages are the top of the tree; everything else is reached from one.

## Keys

| Key | Type | Meaning |
|---|---|---|
| `type` | `"page"` | What this object is |
| `id` | string | Unique among pages; equals the file name `meta/pages/<id>.json` |
| `name` | string | Heading of the page and its label in the navigation. **The URL is derived from it**: `"New employee"` opens at `/new-employee` (lowercase, anything but letters and digits becomes a dash) |
| `fields` | array | Content of the page, in order. Each item is either a [field](./field) (`type` is a component) or a reference to another object, `{ "type": "table", "id": "employees" }`, whose own meta lives in its folder |

```json
{
  "type": "page",
  "id": "employees",
  "name": "Employees",
  "fields": [
    { "type": "input", "id": "search", "props": { "placeholder": "Search employees", "aria-label": "Search" } },
    { "type": "button", "id": "create", "props": { "variant": "outline", "children": "New employee" } },
    { "type": "table", "id": "employees" }
  ]
}
```

## How a page becomes a route

Nothing is generated. The app reads `meta/pages/*.json` itself (`src/meta/pages.ts`, through Vite's `import.meta.glob`) and builds from them, at startup:

- one route per page, `path` = URL from `name`, mounted under the root layout by `src/app/router.tsx` (`...metaRoutes`);
- one link per page in the main navigation (`src/app/root-layout.tsx`, `metaNav`);
- the page itself, rendered by `src/meta/meta-page.tsx`: the heading, then each field in order. A component field is the component from `src/components/ui/<type>` with `props` spread onto it and `data-meta-id` set to the field id; a reference to an object that has no renderer yet shows a placeholder in its place.

Add a file, and the page exists; in `npm run dev` it appears without a restart. Delete the file, and the route and the link are gone.

## Checks

Meta is validated when the app loads it, and one bad file stops the app with every problem listed, so a broken page is never shown:

- `id` matches `^[a-z][a-z0-9-]*$` and equals the file name;
- `name` is 1–60 characters and yields a non-empty URL; two pages may not map to the same URL;
- field ids are unique within the page;
- a component `type` is a folder in `src/components/ui` whose main export is its PascalCase name.

`props` are not checked against the component here: they reach it as they are. One test, `src/meta/meta-page.test.tsx`, opens every page at its URL and expects the heading and each field, so `npm run verify` still covers every page in meta.

::: warning Props are unchecked at load
With generated code, `tsc` rejected a prop the component did not accept. With meta read at runtime that check is gone; a typo in a prop reaches the DOM as an unknown attribute. A check against the component types is on the roadmap.
:::

::: info Draft
More keys to be added.
:::
