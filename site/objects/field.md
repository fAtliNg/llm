# Field

`type: "field"`. The smallest building block; every container is props plus a list of these. A field is one control from the component library and never contains other objects.

## Controls

`control` names the component. The set is what the component library provides, nothing invented on top:

| `control` | Component | Typical use |
|---|---|---|
| `text` | plain text / label | headings, values, help text |
| `input` | Input | one-line text, email, number, date |
| `textarea` | Textarea | multi-line text |
| `select` | Select | one of a fixed list |
| `button` | Button | submit, actions, links |
| `badge` | Badge | a status |
| `alert` | Alert | a message from the API |
| `separator` | Separator | visual break |
| `skeleton` | Skeleton | loading state |

::: info Draft
The list follows `src/components/ui` of the base app (shadcn/ui). Props per control to be described. Open question: whether `control` is a prop of `type: "field"` (as here) or each control is its own `type`.
:::

## Props

::: info Draft
To be described.
:::
