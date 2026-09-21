# Field

`type: "field"`. The smallest building block; every container is props plus a list of these. A field is one control from the component library and never contains other objects.

## Component library

The base app uses **shadcn/ui** (v4.21, style `radix-nova`) on Tailwind 4 with Radix primitives and `lucide-react` icons. shadcn components are not a dependency but source files, and the base app ships with **the whole registry**: 61 components, one folder each under `src/components/ui/`:

```
src/components/ui/button/
├── button.tsx    the component, as published by shadcn
├── index.ts      re-exports it and imports the styles
└── styles.css    extra CSS for this component; empty until needed
```

Imports stay short: `import { Button } from '@/components/ui/button'`. Nothing is added on demand and the model never runs `npx shadcn add`; a control named in a description always exists. Two registry names are absent because shadcn 4 retired them: `form` (replaced by `field`) and `toast` (replaced by `sonner`).

## Controls

`control` is the shadcn name. The full registry as of 2026-09-21, grouped by what a control does in a description. ✓ marks the 13 controls the base app used before the whole registry was added; today all of them are present.

### Input

| `control` | In base app | What it is |
|---|---|---|
| `input` | ✓ | One-line text: text, email, number, date, password |
| `textarea` | ✓ | Multi-line text |
| `select` | ✓ | One of a fixed list, styled dropdown |
| `native-select` | | One of a fixed list, the browser's own `<select>` |
| `combobox` | | Searchable select |
| `checkbox` | | Boolean, or one of many |
| `radio-group` | | Exactly one of a few, all options visible |
| `switch` | | Boolean as an on/off toggle |
| `slider` | | Number within a range |
| `calendar` | | Date picker grid |
| `input-otp` | | One-time code, one box per digit |
| `input-group` | | Input with an attached prefix, suffix or button |
| `toggle` | | A pressed/unpressed button |
| `toggle-group` | | A set of toggles, single or multiple |
| `field` | ✓ | Label, control, description and error laid out together |
| `label` | ✓ | Label for a control |

### Display

| `control` | In base app | What it is |
|---|---|---|
| `badge` | ✓ | Small status chip |
| `alert` | ✓ | A callout with a title and text |
| `card` | ✓ | A bordered box with header, content and footer |
| `table` | ✓ | Table primitives: header, rows, cells |
| `avatar` | | Picture or initials |
| `separator` | ✓ | Horizontal or vertical line |
| `skeleton` | ✓ | Loading placeholder |
| `spinner` | | Loading indicator |
| `progress` | | Progress bar |
| `empty` | | Empty state: icon, title, description, action |
| `item` | | A row with media, title, description and actions |
| `kbd` | | Keyboard key |
| `aspect-ratio` | | Keeps content at a fixed ratio |
| `chart` | | Charts (Recharts) |
| `tooltip` | | Hint on hover |
| `hover-card` | | Richer hint on hover |

### Action

| `control` | In base app | What it is |
|---|---|---|
| `button` | ✓ | Button or link styled as one |
| `button-group` | | Buttons joined into one bar |
| `dropdown-menu` | | Menu opened from a button |
| `context-menu` | | Menu opened with right click |
| `command` | | Command palette with search |
| `pagination` | | Previous/next and page numbers |

### Overlay

| `control` | In base app | What it is |
|---|---|---|
| `dialog` | ✓ | Modal window |
| `alert-dialog` | | Modal that must be confirmed or cancelled |
| `sheet` | | Panel sliding in from an edge |
| `drawer` | | Bottom drawer, touch friendly |
| `popover` | | Small floating panel anchored to a trigger |
| `sonner` | | Brief notification (toasts) |

### Layout and navigation

| `control` | In base app | What it is |
|---|---|---|
| `tabs` | | Tabbed sections |
| `accordion` | | Expandable sections, one or many open |
| `collapsible` | | One expandable section |
| `scroll-area` | | Scroll container with custom scrollbars |
| `resizable` | | Panels with draggable dividers |
| `carousel` | | Slides |
| `breadcrumb` | | Path to the current page |
| `navigation-menu` | | Top navigation with dropdowns |
| `menubar` | | Desktop-style menu bar |
| `sidebar` | | Collapsible app sidebar |
| `direction` | | Provider for text direction (LTR/RTL) |

### Conversation

Added to shadcn for chat interfaces; listed for completeness, unlikely in a description.

| `control` | In base app | What it is |
|---|---|---|
| `message` | | A chat message with avatar, header, footer |
| `bubble` | | Message bubble with variants, reactions, grouping |
| `message-scroller` | | Chat scroll container that follows streaming |
| `attachment` | | File or image attachment with upload state |
| `marker` | | Inline status or system note in a conversation |
| `questionnaire` | | Multi-step questionnaire |

::: info Draft
Which controls a description may actually use, and the props of each, are still to be decided. Open question: whether `control` is a prop of `type: "field"` (as here) or each control is its own `type`.
:::

## Props

::: info Draft
To be described.
:::
