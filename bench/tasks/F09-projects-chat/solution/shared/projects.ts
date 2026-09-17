import { z } from 'zod';

/** Contract for projects, shared by the API and the web app. */

/** What the user fills in. Shared by the form and the API payloads. */
export const projectInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60, 'Keep the name under 60 characters'),
  description: z.string().trim().max(300, 'Keep the description under 300 characters'),
});

export type ProjectInput = z.infer<typeof projectInputSchema>;

/** What the API returns. */
export const projectSchema = projectInputSchema.extend({
  id: z.string(),
});

export type Project = z.infer<typeof projectSchema>;

/** An item of `GET /api/projects`: the project and how many tasks belong to it. */
export const projectListItemSchema = projectSchema.extend({
  taskCount: z.number().int().min(0),
});

export type ProjectListItem = z.infer<typeof projectListItemSchema>;
