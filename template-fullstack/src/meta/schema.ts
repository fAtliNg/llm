import { z } from 'zod';

/** Shape of the JSON objects under `meta/`. Checked once, when the app loads them. */

export const CONTAINER_TYPES = ['page', 'table', 'form', 'panel'] as const;

export const metaId = z
  .string()
  .regex(/^[a-z][a-z0-9-]*$/, 'lowercase letters, digits and dashes, e.g. employee-new');

/** One component from `src/components/ui`, with its own props. */
export const componentFieldSchema = z.strictObject({
  type: z.string().regex(/^[a-z][a-z0-9-]*$/, 'a folder name from src/components/ui, e.g. button'),
  id: metaId,
  props: z.record(z.string(), z.unknown()).default({}),
});

/** A container placed inside another one; its own meta lives in its own folder. */
export const containerRefSchema = z.strictObject({ type: z.enum(CONTAINER_TYPES), id: metaId });

export const fieldSchema = z.union([containerRefSchema, componentFieldSchema]);

/** One cell of the grid: holds one field. Width and alignment will be added here. */
export const columnSchema = z.strictObject({ field: fieldSchema });

/** One line of the grid: its columns share the width equally. */
export const rowSchema = z.strictObject({ columns: z.array(columnSchema).min(1) });

export const pageSchema = z
  .strictObject({
    type: z.literal('page'),
    id: metaId,
    name: z.string().trim().min(1).max(60),
    rows: z.array(rowSchema).default([]),
  })
  .superRefine((page, ctx) => {
    const ids = pageFields(page).map((f) => f.id);
    for (const dup of ids.filter((x, i) => ids.indexOf(x) !== i)) {
      ctx.addIssue({ code: 'custom', message: `fields: id "${dup}" is used twice` });
    }
    if (pageUrl(page.name) === '') {
      ctx.addIssue({ code: 'custom', message: 'name must contain a letter or a digit' });
    }
  });

export type MetaColumn = z.infer<typeof columnSchema>;
export type MetaRow = z.infer<typeof rowSchema>;
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

/** Every field of a page, in reading order: row by row, column by column. */
export function pageFields(page: { rows: MetaRow[] }): MetaField[] {
  return page.rows.flatMap((row) => row.columns.map((column) => column.field));
}

export function isContainerRef(field: MetaField): field is ContainerRef {
  return (CONTAINER_TYPES as readonly string[]).includes(field.type);
}
