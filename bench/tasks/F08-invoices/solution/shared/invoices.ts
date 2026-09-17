import { z } from 'zod';

/** Contract for invoices, shared by the API and the web app. */
export const INVOICE_STATUSES = ['draft', 'sent', 'paid'] as const;

export const invoiceStatusSchema = z.enum(INVOICE_STATUSES);

export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

/** What the user fills in. The status is not here: it only changes through the send and pay actions. */
export const invoiceInputSchema = z.object({
  number: z.string().regex(/^INV-\d{4}$/, 'Use the format INV-0001'),
  customer: z
    .string()
    .trim()
    .min(1, 'Customer is required')
    .max(100, 'Keep the customer under 100 characters'),
  amount: z
    .number('Enter an amount')
    .positive('Amount must be greater than 0')
    .multipleOf(0.01, 'Use at most two decimals'),
});

export type InvoiceInput = z.infer<typeof invoiceInputSchema>;

/** What the API returns. */
export const invoiceSchema = invoiceInputSchema.extend({
  id: z.string(),
  status: invoiceStatusSchema,
});

export type Invoice = z.infer<typeof invoiceSchema>;
