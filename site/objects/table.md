# Table

`type: "table"`. Columns and rows. Lives in `meta/tables/<id>.json` and is placed in a column as a field under the same id: `"fields": { "page-keys": { "type": "table" } }`.

## Keys

| Key | Type | Meaning |
|---|---|---|
| `type` | `"table"` | What this object is |
| `id` | string | Unique among tables; equals the file name and the field id that references it |
| `caption` | string | Optional caption |
| `columns` | Column[] | `key` (the row property, camelCase), `label` (header text), optional `width` (CSS) and `align` (`left`, `center`, `right`) |
| `rows` | object[] | The rows themselves, one object per row keyed by column `key`. Values: string, number, boolean or null |

```json
{
  "type": "table",
  "id": "page-keys",
  "columns": [
    { "key": "key", "label": "Key", "width": "120px" },
    { "key": "meaning", "label": "Meaning" }
  ],
  "rows": [
    { "key": "type", "meaning": "What this object is" },
    { "key": "id", "meaning": "Unique among pages; equals the file name" }
  ]
}
```

::: info Draft
Rows written in the file are the first step. Rows from an API (a `source`), sorting, filters, pagination and row actions are next; the checks are the same either way: every row property must be a column key.
:::
