# Objects

Everything the library builds is described by JSON objects. There are five kinds, told apart by the `type` field, which every object must have:

| `type` | What it is | Made of |
|---|---|---|
| [`page`](./page) | A route in the app with a heading and content | props + `items` |
| [`table`](./table) | A list of rows with columns | props + `items` |
| [`form`](./form) | Inputs with validation and a submit | props + `items` |
| [`panel`](./panel) | A form-like layout without inputs or validation: text, badges, buttons | props + `items` |
| [`field`](./field) | The smallest building block: one control from the component library | props |

The first four are **containers**: a few props of their own plus an `items` array of fields. A field is the **atom**; it never contains other objects.

```json
{
  "type": "page",
  "items": [
    { "type": "field", "control": "text", "value": "Hello" },
    { "type": "field", "control": "button", "label": "Save" }
  ]
}
```

::: info Draft
Only `type` is fixed so far. The props of each object are described on its own page as they are decided.
:::

## Conventions

- `type` is always present and is one of `page`, `table`, `form`, `panel`, `field`.
- Containers hold fields in `items`, in display order.
- Unknown props are an error, not ignored: a description is checked before anything is generated.
