# Objects

Everything the library builds is described by JSON objects, the **meta** of the app (see [where they live](./meta)). There are five kinds, told apart by the `type` field, which every object must have:

| `type` | What it is | Made of |
|---|---|---|
| [`page`](./page) | A route in the app with a heading and content | `id`, `name`, `rows` |
| [`table`](./table) | A list of rows with columns | `id`, `name`, … |
| [`form`](./form) | Inputs with validation and a submit | `id`, `name`, … |
| [`panel`](./panel) | A form-like layout without inputs or validation: text, badges, buttons | `id`, `name`, … |
| [`field`](./field) | The smallest building block: one component from `src/components/ui` | `id`, `props` |

The first four are **containers**. Each has `id` and `name`, and places its fields on a grid of `rows`, each row a list of `columns`, each column holding one `field`. A field is the **atom**; it never contains other objects. Its `type` is the name of a component folder in `src/components/ui`, and its `props` are that component's props.

```json
{
  "type": "page",
  "id": "employees",
  "name": "Employees",
  "rows": [
    {
      "columns": [
        { "field": { "type": "input", "id": "search", "props": { "placeholder": "Search" } } },
        { "field": { "type": "button", "id": "create", "props": { "children": "New employee" } } }
      ]
    }
  ]
}
```

## Conventions

- `type` is always present. For a container it is one of `page`, `table`, `form`, `panel`; for a field it is a component name.
- `id` is unique within the description; it becomes the stable handle for tests, references and generated names.
- Containers hold fields on a grid: `rows` top to bottom, `columns` left to right, one field per column.
- A field's `props` must match the props of its component, no more and no less: the description is checked against the component's TypeScript props before anything is generated.
- Unknown keys are an error, not ignored.

::: info Draft
More keys will be added to both containers and fields as they are decided.
:::
