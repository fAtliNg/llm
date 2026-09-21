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

export const pageSchema = z
  .strictObject({
    type: z.literal('page'),
    id: metaId,
    name: z.string().trim().min(1).max(60),
    fields: z.array(fieldSchema).default([]),
  })
  .superRefine((page, ctx) => {
    const ids = page.fields.map((f) => f.id);
    for (const dup of ids.filter((x, i) => ids.indexOf(x) !== i)) {
      ctx.addIssue({ code: 'custom', message: `fields: id "${dup}" is used twice` });
    }
    if (pageUrl(page.name) === '') {
      ctx.addIssue({ code: 'custom', message: 'name must contain a letter or a digit' });
    }
  });

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

export function isContainerRef(field: MetaField): field is ContainerRef {
  return (CONTAINER_TYPES as readonly string[]).includes(field.type);
}
