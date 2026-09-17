import { useNavigate } from 'react-router';

import { useCreateInvoiceMutation } from '@/features/invoices/api';
import { InvoiceForm } from '@/features/invoices/invoice-form';
import type { InvoiceInput } from '@/features/invoices/model';

export function InvoiceNewPage() {
  const navigate = useNavigate();
  const [createInvoice] = useCreateInvoiceMutation();

  async function handleSubmit(values: InvoiceInput) {
    await createInvoice(values).unwrap();
    await navigate('/invoices');
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">New invoice</h1>
      <InvoiceForm onSubmit={handleSubmit} submitLabel="Create" />
    </section>
  );
}
