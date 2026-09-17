import { z } from 'zod';

/** Contract for contacts, shared by the API and the web app. */
export const CONTACT_GROUPS = ['family', 'friends', 'work'] as const;

export const contactGroupSchema = z.enum(CONTACT_GROUPS);

export type ContactGroup = z.infer<typeof contactGroupSchema>;

/** What the user fills in. Shared by the form and the API payloads. */
export const contactInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Keep the name under 100 characters'),
  email: z.email('Enter a valid email'),
  /** International format: a plus and 7 to 15 digits. Null when there is no phone. */
  phone: z
    .string()
    .regex(/^\+\d{7,15}$/, 'Use the format +123456789')
    .nullable(),
  group: contactGroupSchema,
});

export type ContactInput = z.infer<typeof contactInputSchema>;

/** What the API returns. */
export const contactSchema = contactInputSchema.extend({
  id: z.string(),
  /** Not part of the form: toggled from the list. */
  favorite: z.boolean(),
});

export type Contact = z.infer<typeof contactSchema>;

/** Body of `PATCH /api/contacts/:contactId`: any of the form fields, or the favourite flag. */
export const contactPatchSchema = contactInputSchema.partial().extend({
  favorite: z.boolean().optional(),
});

export type ContactPatch = z.infer<typeof contactPatchSchema>;
