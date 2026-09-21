# Objects

Everything the library builds is described by JSON objects, the **meta** of the app (see [where they live](./meta)). There are six kinds, told apart by the `type` field, which every object must have:

| `type` | What it is | Made of |
|---|---|---|
| [`page`](./page) | A route in the app with a heading and content | `id`, `name`, `layout`, `fields`, `grid` |
| [`layout`](./layout) | A frame around pages: header, menu, footer and the place for the page | `id`, `fields`, `grid` |
| [`table`](./table) | Columns and rows | `id`, `columns`, `rows` |
| [`form`](./form) | Inputs with validation and a submit | `id`, `name`, … |
| [`panel`](./panel) | Fields and a grid without a URL, placed in a column so it can hold many fields | `id`, `fields`, `grid` |
| [`field`](./field) | The smallest building block: one component from `src/components/ui` | `id`, `props` |

The first four are **containers**. Each has `id` and `name`, declares its fields once in `fields` (keyed by id) and places them with a `grid` per screen size: `rows` top to bottom, `columns` left to right, one field id per column. A field is the **atom**; it never contains other objects. Its `type` is the name of a component folder in `src/components/ui`, and its `props` are that component's props.

```json
{
  "type": "page",
  "id": "employees",
  "name": "Employees",
  "fields": {
    "search": { "type": "input", "props": { "placeholder": "Search" } },
    "create": { "type": "button", "props": { "children": "New employee" } }
  },
  "layout": "docs",
  "grid": {
    "desktop": { "rows": [{ "columns": [{ "field": "search" }, { "field": "create" }] }] },
    "mobile": { "rows": [{ "columns": [{ "field": "search" }] }, { "columns": [{ "field": "create" }] }] }
  }
}
```

## Conventions

- `type` is always present. For a container it is one of `page`, `layout`, `table`, `form`, `panel`; for a field it is a component name or a built-in (`children`, `nav`, `text`, `icon`, `image`, `theme`, `search`, `pager`).
- `id` is unique within its folder for containers and within the file for fields; it is the stable handle for layouts, tests and references.
- Containers define fields once and place them per screen size (`desktop` required, `tablet` and `mobile` optional) on a grid: `rows` top to bottom, `columns` left to right, one field per column.
- A field's `props` must match the props of its component, no more and no less: the description is checked against the component's TypeScript props before anything is generated.
- Unknown keys are an error, not ignored.

::: info Draft
More keys will be added to both containers and fields as they are decided.
:::
