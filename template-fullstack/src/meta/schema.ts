import { z } from 'zod';

/** Shape of the JSON objects under `meta/`. Checked once, when the app loads them. */

export const CONTAINER_TYPES = ['page', 'table', 'form', 'panel'] as const;

/** Screen sizes a grid can target, widest first; a missing size falls back to the next wider one. */
export const DEVICES = ['desktop', 'tablet', 'mobile'] as const;
export type Device = (typeof DEVICES)[number];

export const metaId = z
  .string()
  .regex(/^[a-z][a-z0-9-]*$/, 'lowercase letters, digits and dashes, e.g. employee-new');

/** One component from `src/components/ui`, with its own props. */
export const componentFieldSchema = z.strictObject({
  type: z.string().regex(/^[a-z][a-z0-9-]*$/, 'a folder name from src/components/ui, e.g. button'),
  props: z.record(z.string(), z.unknown()).default({}),
});

/** A container placed inside another one; its own meta lives in its own folder. */
export const containerRefSchema = z.strictObject({ type: z.enum(CONTAINER_TYPES) });

/**
 * Fields the app provides itself, not the component library:
 * `children` marks where a layout shows the page; `nav` links every page; `text` is a heading or a
 * paragraph.
 */
export const childrenFieldSchema = z.strictObject({ type: z.literal('children') });
export const navFieldSchema = z.strictObject({
  type: z.literal('nav'),
  props: z
    .strictObject({ orientation: z.enum(['horizontal', 'vertical']).default('horizontal') })
    .default({ orientation: 'horizontal' }),
});
export const textFieldSchema = z.strictObject({
  type: z.literal('text'),
  props: z.strictObject({
    children: z.string(),
    variant: z.enum(['title', 'heading', 'body', 'muted']).default('body'),
  }),
});
export const BUILTIN_TYPES = ['children', 'nav', 'text'] as const;

export const fieldSchema = z.union([
  containerRefSchema,
  childrenFieldSchema,
  navFieldSchema,
  textFieldSchema,
  componentFieldSchema,
]);

/** Horizontal alignment of content inside a cell; absent means it stretches to the cell width. */
export const alignSchema = z.enum(['left', 'center', 'right']);
/** Vertical alignment of content inside a cell; absent means it stretches to the row height. */
export const valignSchema = z.enum(['top', 'middle', 'bottom']);
/** A number is pixels on every side; a string is any CSS value, e.g. "8px 16px". */
export const spacingSchema = z.union([z.number().int().min(0), z.string().trim().min(1)]);

const boxSchema = {
  align: alignSchema.optional(),
  valign: valignSchema.optional(),
  margin: spacingSchema.optional(),
  padding: spacingSchema.optional(),
};

/**
 * One cell of the grid: which field sits here, and how it sits. A column's alignment overrides the
 * row's. `width` is any CSS grid track size ("240px", "1fr", "25%"); columns without it share what is
 * left equally.
 */
export const columnSchema = z.strictObject({
  field: metaId,
  width: z.string().trim().min(1).optional(),
  ...boxSchema,
});

/** One line of the grid. Alignment here applies to every column. */
export const rowSchema = z.strictObject({ columns: z.array(columnSchema).min(1), ...boxSchema });

export const gridSchema = z.strictObject({ rows: z.array(rowSchema).min(1) });

/** The grid per screen size. Desktop is required; the others fall back to the next wider one. */
export const gridsSchema = z.strictObject({
  desktop: gridSchema,
  tablet: gridSchema.optional(),
  mobile: gridSchema.optional(),
});

function placedIds(grid: z.infer<typeof gridSchema>): string[] {
  return grid.rows.flatMap((row) => row.columns.map((column) => column.field));
}

/** Rules shared by everything that has fields and a grid: every placed id exists and is placed once. */
function checkGrids(
  value: { fields: Record<string, unknown>; grid: z.infer<typeof gridsSchema> },
  ctx: z.RefinementCtx,
): void {
  for (const device of DEVICES) {
    const grid = value.grid[device];
    if (!grid) continue;
    const used = placedIds(grid);
    for (const id of used) {
      if (!(id in value.fields)) {
        ctx.addIssue({ code: 'custom', message: `grid.${device}: field "${id}" is not in fields` });
      }
    }
    for (const dup of used.filter((x, i) => used.indexOf(x) !== i)) {
      ctx.addIssue({ code: 'custom', message: `grid.${device}: field "${dup}" is placed twice` });
    }
  }
}

export const pageSchema = z
  .strictObject({
    type: z.literal('page'),
    id: metaId,
    name: z.string().trim().min(1).max(60),
    /** The layout (frame) this page is shown in, by id from `meta/layouts`. None: the page stands alone. */
    layout: metaId.optional(),
    /** Every field of the page once, by its id. Where it goes is the grid's business. */
    fields: z.record(metaId, fieldSchema).default({}),
    grid: gridsSchema,
  })
  .superRefine((page, ctx) => {
    checkGrids(page, ctx);
    for (const [id, field] of Object.entries(page.fields)) {
      if (field.type === 'children') {
        ctx.addIssue({
          code: 'custom',
          message: `fields.${id}: "children" belongs in a layout, not a page`,
        });
      }
    }
    if (pageUrl(page.name) === '') {
      ctx.addIssue({ code: 'custom', message: 'name must contain a letter or a digit' });
    }
  });

/**
 * A frame around pages: header, menu, footer and, somewhere in its grid, the `children` field where
 * the page goes. A layout may itself sit in another layout.
 */
export const layoutSchema = z
  .strictObject({
    type: z.literal('layout'),
    id: metaId,
    layout: metaId.optional(),
    fields: z.record(metaId, fieldSchema).default({}),
    grid: gridsSchema,
  })
  .superRefine((layout, ctx) => {
    checkGrids(layout, ctx);
    const slots = Object.entries(layout.fields).filter(([, f]) => f.type === 'children');
    if (slots.length !== 1) {
      ctx.addIssue({
        code: 'custom',
        message: `a layout needs exactly one field of type "children", found ${String(slots.length)}`,
      });
      return;
    }
    const [slotId] = slots[0] as [string, unknown];
    for (const device of DEVICES) {
      const grid = layout.grid[device];
      if (grid && !placedIds(grid).includes(slotId)) {
        ctx.addIssue({
          code: 'custom',
          message: `grid.${device}: the "children" field "${slotId}" is not placed, pages would vanish`,
        });
      }
    }
  });

export type MetaColumn = z.infer<typeof columnSchema>;
export type MetaRow = z.infer<typeof rowSchema>;
export type MetaGrid = z.infer<typeof gridSchema>;
export type MetaGrids = z.infer<typeof gridsSchema>;
export type ComponentField = z.infer<typeof componentFieldSchema>;
export type ContainerRef = z.infer<typeof containerRefSchema>;
export type MetaField = z.infer<typeof fieldSchema>;
export type MetaPage = z.infer<typeof pageSchema>;
export type MetaLayout = z.infer<typeof layoutSchema>;

/** "New employee" -> "new-employee": the URL a page opens at. */
export function pageUrl(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** The grid a screen size shows: its own, or the nearest wider one that is defined. */
export function gridFor(grids: MetaGrids, device: Device): MetaGrid {
  for (const candidate of DEVICES.slice(0, DEVICES.indexOf(device) + 1).reverse()) {
    const grid = grids[candidate];
    if (grid) return grid;
  }
  return grids.desktop;
}

export function isContainerRef(field: MetaField): field is ContainerRef {
  return (CONTAINER_TYPES as readonly string[]).includes(field.type);
}

export type NavField = z.infer<typeof navFieldSchema>;
export type TextField = z.infer<typeof textFieldSchema>;

// A component field's `type` is any string, so TypeScript cannot narrow the union on `type` alone.
export function isNav(field: MetaField): field is NavField {
  return field.type === 'nav';
}

export function isText(field: MetaField): field is TextField {
  return field.type === 'text';
}

export function isBuiltin(field: MetaField): boolean {
  return (BUILTIN_TYPES as readonly string[]).includes(field.type);
}
