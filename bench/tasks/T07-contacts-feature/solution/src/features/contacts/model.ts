import { z } from 'zod';

export const contactInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Keep the name under 120 characters'),
  email: z.email('Enter a valid email'),
});

export type ContactInput = z.infer<typeof contactInputSchema>;

export const contactSchema = contactInputSchema.extend({
  id: z.string(),
});

export type Contact = z.infer<typeof contactSchema>;
