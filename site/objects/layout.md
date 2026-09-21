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
        { "columns": [{ "field": "sidebar", "width": "220px", "valign": "top", "background": "$muted", "padding": 8 }, { "field": "content" }] },
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

For a frame with many fields per area, put a [panel](./panel) in the column: the base app's `meta/layouts/docs.json` is a documentation site (sticky 64px header with brand, search and section menu; a sticky 272px sidebar with grouped menus; the page with an outline column) built from one layout and a few panels.

## Built-in fields

Three field types come from the app, not from the component library. They are what a frame is made of:

| `type` | Props | What it is |
|---|---|---|
| `children` | none | Where the page is shown. Layouts only; exactly one per layout |
| `nav` | `orientation`: `"horizontal"` (default) or `"vertical"`; `variant`: `"pills"` (default, the active link has a filled background) or `"plain"` (text links, the active one in the brand colour); `section`: only pages of that section; `sections: true`: one link per section, to its first page (a top menu) | Links to pages, the current one highlighted |
| `text` | `children` (the text); `variant`: `"title"` (h1), `"heading"` (h2), `"subheading"` (h3), `"body"` (default), `"muted"`, `"small"` (a group label), `"code"` (a preformatted block), `"link"` (with `href`) | A heading, a paragraph, a code block, a link; the component library has no plain-text component |
| `icon` | `name` (a lucide icon, kebab-case), `size` (default 20), `label`, `href` (makes it a link; external ones open in a new tab) | An icon, on its own or as a link |
| `image` | `src`, `alt`, `width`, `height` | An image, e.g. the logo from `public/` |
| `theme` | none | Switches between the first light and the first dark [theme](./theme); the choice is kept in `localStorage` and follows the system preference until set |
| `search` | `placeholder` | A search box over page names and text fields; hits are links to the pages |
| `pager` | none | Previous and next page, in navigation order |

Navigation order is the pages' `order`, lowest first; pages without it follow, by name.

All of them work on pages and panels too.

## Checks

Besides the page checks: exactly one `children` field, placed in every defined grid; a `layout` a page or layout names must exist in `meta/layouts`; layouts must not nest in a cycle.
