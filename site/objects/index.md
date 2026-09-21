# Objects

Everything the library builds is described by JSON objects, the **meta** of the app (see [where they live](./meta)). There are five kinds, told apart by the `type` field, which every object must have:

| `type` | What it is | Made of |
|---|---|---|
| [`page`](./page) | A route in the app with a heading and content | `id`, `name`, `fields` |
| [`table`](./table) | A list of rows with columns | `id`, `name`, `fields` |
| [`form`](./form) | Inputs with validation and a submit | `id`, `name`, `fields` |
| [`panel`](./panel) | A form-like layout without inputs or validation: text, badges, buttons | `id`, `name`, `fields` |
| [`field`](./field) | The smallest building block: one component from `src/components/ui` | `id`, `props` |

The first four are **containers**. Each has `id`, `name` and `fields`: an array of fields in display order. A field is the **atom**; it never contains other objects. Its `type` is the name of a component folder in `src/components/ui`, and its `props` are that component's props.

```json
{
  "type": "page",
  "id": "employees",
  "name": "Employees",
  "fields": [
    { "type": "input", "id": "search", "props": { "placeholder": "Search" } },
    { "type": "button", "id": "create", "props": { "variant": "default", "children": "New employee" } }
  ]
}
```

## Conventions

- `type` is always present. For a container it is one of `page`, `table`, `form`, `panel`; for a field it is a component name.
- `id` is unique within the description; it becomes the stable handle for tests, references and generated names.
- Containers hold fields in `fields`, in display order.
- A field's `props` must match the props of its component, no more and no less: the description is checked against the component's TypeScript props before anything is generated.
- Unknown keys are an error, not ignored.

::: info Draft
More keys will be added to both containers and fields as they are decided.
:::
