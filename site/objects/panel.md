# Panel

`type: "panel"`. Fields and a grid, like a page, but without a name or a URL. A panel is placed in a column of a page, a layout or another panel, so **a column can hold many fields**: a header bar, a sidebar with several menus, an article with its paragraphs, an outline.

Lives in `meta/panels/<id>.json` and is referenced as a field under the same id:

```json
"fields": { "sidebar": { "type": "panel" } }
```

## Keys

| Key | Type | Meaning |
|---|---|---|
| `type` | `"panel"` | What this object is |
| `id` | string | Unique among panels; equals the file name and the field id that references it |
| `background` | string | Optional: any CSS background |
| `fields` | object | Every field of the panel once, keyed by id, exactly as on a [page](./page) |
| `grid` | object | Where the fields go, per screen size, exactly as on a page |

A panel inside a layout may hold the layout's `children` field. A panel may not contain itself.

```json
{
  "type": "panel",
  "id": "sidebar",
  "fields": {
    "guide-h": { "type": "text", "props": { "children": "Guide", "variant": "small" } },
    "guide": { "type": "nav", "props": { "orientation": "vertical", "variant": "plain", "section": "Guide" } },
    "objects-h": { "type": "text", "props": { "children": "Objects", "variant": "small" } },
    "objects": { "type": "nav", "props": { "orientation": "vertical", "variant": "plain", "section": "Objects" } }
  },
  "grid": {
    "desktop": {
      "rows": [
        { "gap": 0, "columns": [{ "field": "guide-h" }] },
        { "gap": 0, "columns": [{ "field": "guide" }], "margin": "8px 0 24px" },
        { "gap": 0, "columns": [{ "field": "objects-h" }] },
        { "gap": 0, "columns": [{ "field": "objects" }], "margin": "8px 0 24px" }
      ]
    }
  }
}
```
