import { z } from 'zod';

export const projectInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Keep the name under 120 characters'),
  /** ISO date (YYYY-MM-DD) or empty string when there is no deadline. */
  deadline: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, 'Use the YYYY-MM-DD format'),
});

export type ProjectInput = z.infer<typeof projectInputSchema>;

export const projectSchema = projectInputSchema.extend({
  id: z.string(),
});

export type Project = z.infer<typeof projectSchema>;
