import type { InvoiceStatus } from '@shared/invoices';

/** The data contract lives in `shared/invoices.ts`; this file adds what only the UI needs. */
export * from '@shared/invoices';

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
};

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** `$1,250.00` */
export function formatMoney(amount: number) {
  return money.format(amount);
}
