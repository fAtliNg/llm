# Panel

`type: "panel"`. Laid out like a form, but without inputs or validation: text, values, badges, buttons. Use it for read-only views, confirmations and action bars.

::: tip Naming
Working name. Alternatives considered: `view`, `section`. The difference from `form` is exactly one thing: nothing is entered or validated.
:::

## Keys

| Key | Type | Meaning |
|---|---|---|
| `type` | `"panel"` | What this object is |
| `id` | string | Unique within the description |
| `name` | string | Human-readable name |
| `fields` | [Field](./field)[] | Things to display or trigger, in order; nothing collects input |

::: info Draft
More keys to be added.
:::
