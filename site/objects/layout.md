# Layout

`type: "layout"`. A frame around pages: header, menu, sidebar, footer, and one place where the page itself goes. Lives in `meta/layouts/<id>.json`; a page names it with `"layout": "<id>"`.

## Keys

| Key | Type | Meaning |
|---|---|---|
| `type` | `"layout"` | What this object is |
| `id` | string | Unique among layouts; equals the file name |
| `layout` | string | Optional: the layout this one sits in. Layouts nest; the page ends up inside all of them, innermost first |
| `background` | string | Optional: background of the whole frame, any CSS value |
| `fields` | object | Every field of the frame once, keyed by id, exactly as on a [page](./page). **Exactly one field must be `{ "type": "children" }`**: that is where the page is shown |
| `grid` | object | Where the fields go, per screen size, exactly as on a page: `desktop` required, `tablet` and `mobile` optional. The `children` field must be placed in every grid that is defined, otherwise pages would vanish on that screen |

A layout has no `name` and no URL: it never opens by itself.

```json
{
  "type": "layout",
  "id": "docs",
  "fields": {
    "brand": { "type": "text", "props": { "children": "Blueprint", "variant": "heading" } },
    "menu": { "type": "nav", "props": { "orientation": "horizontal" } },
    "sidebar": { "type": "nav", "props": { "orientation": "vertical" } },
    "content": { "type": "children" },
    "footer": { "type": "text", "props": { "children": "Built from meta.", "variant": "muted" } }
  },
  "grid": {
    "desktop": {
      "rows": [
        { "valign": "middle", "columns": [{ "field": "brand", "width": "160px" }, { "field": "menu", "align": "right" }] },
        { "columns": [{ "field": "sidebar", "width": "220px", "valign": "top", "background": "var(--muted)", "padding": 8 }, { "field": "content" }] },
        { "columns": [{ "field": "footer", "align": "center" }] }
      ]
    },
    "mobile": {
      "rows": [
        { "columns": [{ "field": "brand" }] },
        { "columns": [{ "field": "content" }] },
        { "columns": [{ "field": "sidebar" }] },
        { "columns": [{ "field": "footer", "align": "center" }] }
      ]
    }
  }
}
```

On desktop: a header line, then a 220px sidebar next to the page, then the footer. On mobile: the header, the page, the menu below it, the footer. The `children` field moves like any other, so the page can sit anywhere on any screen.

## Built-in fields

Three field types come from the app, not from the component library. They are what a frame is made of:

| `type` | Props | What it is |
|---|---|---|
| `children` | none | Where the page is shown. Layouts only; exactly one per layout |
| `nav` | `orientation`: `"horizontal"` (default) or `"vertical"` | Links to every page in `meta/pages`, in file order, the current one highlighted |
| `text` | `children` (the text), `variant`: `"title"`, `"heading"`, `"body"` (default), `"muted"` | A heading or a paragraph; the component library has no plain-text component |

`nav` and `text` work on pages too.

## Checks

Besides the page checks: exactly one `children` field, placed in every defined grid; a `layout` a page or layout names must exist in `meta/layouts`; layouts must not nest in a cycle.
