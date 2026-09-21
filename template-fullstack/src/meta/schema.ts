import { z } from 'zod';

/** Shape of the JSON objects under `meta/`. Checked once, when the app loads them. */

export const CONTAINER_TYPES = ['page', 'table', 'form', 'panel'] as const;

/** Screen sizes a layout can target, widest first; a missing size falls back to the next wider one. */
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

export const fieldSchema = z.union([containerRefSchema, componentFieldSchema]);

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

/** One cell of the grid: which field sits here, and how it sits. A column's alignment overrides the row's. */
export const columnSchema = z.strictObject({ field: metaId, ...boxSchema });

/** One line of the grid: its columns share the width equally. Alignment here applies to every column. */
export const rowSchema = z.strictObject({ columns: z.array(columnSchema).min(1), ...boxSchema });

export const layoutSchema = z.strictObject({ rows: z.array(rowSchema).min(1) });

export const pageSchema = z
  .strictObject({
    type: z.literal('page'),
    id: metaId,
    name: z.string().trim().min(1).max(60),
    /** Every field of the page once, by its id. Where it goes is the layout's business. */
    fields: z.record(metaId, fieldSchema).default({}),
    /** The grid per screen size. Desktop is required; the others fall back to the next wider one. */
    layout: z.strictObject({
      desktop: layoutSchema,
      tablet: layoutSchema.optional(),
      mobile: layoutSchema.optional(),
    }),
  })
  .superRefine((page, ctx) => {
    for (const device of DEVICES) {
      const layout = page.layout[device];
      if (!layout) continue;
      const used = layout.rows.flatMap((row) => row.columns.map((column) => column.field));
      for (const id of used) {
        if (!(id in page.fields)) {
          ctx.addIssue({
            code: 'custom',
            message: `layout.${device}: field "${id}" is not in fields`,
          });
        }
      }
      for (const dup of used.filter((x, i) => used.indexOf(x) !== i)) {
        ctx.addIssue({
          code: 'custom',
          message: `layout.${device}: field "${dup}" is placed twice`,
        });
      }
    }
    if (pageUrl(page.name) === '') {
      ctx.addIssue({ code: 'custom', message: 'name must contain a letter or a digit' });
    }
  });

export type MetaColumn = z.infer<typeof columnSchema>;
export type MetaRow = z.infer<typeof rowSchema>;
export type MetaLayout = z.infer<typeof layoutSchema>;
export type ComponentField = z.infer<typeof componentFieldSchema>;
export type ContainerRef = z.infer<typeof containerRefSchema>;
export type MetaField = z.infer<typeof fieldSchema>;
export type MetaPage = z.infer<typeof pageSchema>;

/** "New employee" -> "new-employee": the URL a page opens at. */
export function pageUrl(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** The layout a screen size shows: its own, or the nearest wider one that is defined. */
export function layoutFor(page: MetaPage, device: Device): MetaLayout {
  for (const candidate of DEVICES.slice(0, DEVICES.indexOf(device) + 1).reverse()) {
    const layout = page.layout[candidate];
    if (layout) return layout;
  }
  return page.layout.desktop;
}

export function isContainerRef(field: MetaField): field is ContainerRef {
  return (CONTAINER_TYPES as readonly string[]).includes(field.type);
}
