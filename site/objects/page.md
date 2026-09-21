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

## What is generated

`npm run gen:meta` reads every page and writes, under `src/generated/`:

- `pages/<url>-page.tsx`: a component with the heading and the fields as JSX. A component field becomes `<Button data-meta-id="create" variant="outline">New employee</Button>`; a reference to an object that has no generator yet becomes a visible placeholder in its place.
- `pages/<url>-page.test.tsx`: opens the URL, expects the heading and every field by its id.
- `routes.tsx` and `nav.ts`: the routes mounted under the root layout and the navigation links, in file order.

`src/generated/` is owned by the generator and rewritten on every run. Then `npm run verify`: because props are emitted as JSX attributes, `typecheck` rejects a prop the component does not accept, with the component's own message ("Property 'colour' does not exist… Did you mean 'color'?").

## Checks before anything is written

- `id` matches `^[a-z][a-z0-9-]*$` and equals the file name.
- `name` is 1–60 characters and yields a non-empty URL; two pages may not map to the same URL.
- Field ids are unique within the page; a component `type` must be a folder in `src/components/ui` whose main export is its PascalCase name.

::: info Draft
More keys to be added.
:::
