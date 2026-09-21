# Theme

`type: "theme"`. The colours and the typography of the app. Lives in `meta/themes/<id>.json`; the file name is the theme name. The base app ships with `light` and `dark`, both the palette and the type of the VitePress default theme.

## Keys

| Key | Type | Meaning |
|---|---|---|
| `type` | `"theme"` | What this object is |
| `id` | string | The theme name; equals the file name |
| `dark` | boolean | A dark theme. Default `false`. It decides which theme the system preference picks and sets the `dark` class the component library uses |
| `colors` | object | Tokens: `name` → any CSS colour. Every theme defines the same set; the tokens the component library is painted with are required (`background`, `foreground`, `primary`, `muted`, `border`… the full list is `REQUIRED_TOKENS` in `src/meta/schema.ts`); add as many more as you like |
| `typography` | object | `fonts` (`sans`, `mono`), `base` (the body text) and `text`: one style per [text](./layout#built-in-fields) variant — `title`, `heading`, `subheading`, `body`, `muted`, `small`, `code`, `link` |

A text style: `size`, `lineHeight` (px), `weight`, optional `letterSpacing`, `family` (`sans` or `mono`), `color` (a `$token`), optional `background` (a `$token`), `padding`, `radius`.

```json
{
  "type": "theme",
  "id": "light",
  "dark": false,
  "colors": {
    "background": "#ffffff",
    "foreground": "#3c3c43",
    "primary": "#3451b2",
    "muted": "#f6f6f7",
    "muted-foreground": "#67676c",
    "border": "#e2e2e3",
    "code-bg": "#8e96aa24"
  },
  "typography": {
    "fonts": { "sans": "'Inter Variable', sans-serif", "mono": "ui-monospace, Menlo, monospace" },
    "base": { "size": 16, "lineHeight": 24, "weight": 400, "color": "$foreground" },
    "text": {
      "title": { "size": 28, "lineHeight": 40, "weight": 700, "letterSpacing": "-0.02em", "color": "$foreground" },
      "body": { "size": 16, "lineHeight": 28, "color": "$foreground" },
      "code": { "size": 14, "lineHeight": 24, "family": "mono", "color": "$foreground", "background": "$code-bg", "padding": "20px 24px", "radius": 8 }
    }
  }
}
```

## Using a token

Anywhere a colour is written in meta (`background`, `border`, a text style), write `$token` instead of a value:

```json
{ "field": "sidebar", "background": "$sidebar", "border": { "right": "1px solid $border" } }
```

The token becomes `var(--token)` and follows the active theme. A token that no theme defines, or a token missing from one theme, is an error at startup.

## How it works

At startup the app turns the themes into one stylesheet: every colour as a CSS variable under `[data-theme="<id>"]`, the body font, and a `.meta-text-<variant>` class per text style. The component library reads the same variables, so a theme colours buttons, inputs and tables too. The first theme is the default; with no stored choice, the system preference picks a `dark` theme when it prefers dark. The built-in `theme` field switches between the first light theme and the first dark one and remembers the choice.
