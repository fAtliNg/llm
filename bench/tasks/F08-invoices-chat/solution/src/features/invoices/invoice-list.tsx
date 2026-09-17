import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePayInvoiceMutation, useSendInvoiceMutation } from '@/features/invoices/api';
import {
  formatMoney,
  INVOICE_STATUS_LABELS,
  type Invoice,
  type InvoiceStatus,
} from '@/features/invoices/model';

const statusVariant: Record<InvoiceStatus, 'outline' | 'secondary' | 'default'> = {
  draft: 'outline',
  sent: 'secondary',
  paid: 'default',
};

/** The next step of an invoice, if there is one. */
function InvoiceAction({ invoice }: { invoice: Invoice }) {
  const [sendInvoice, sending] = useSendInvoiceMutation();
  const [payInvoice, paying] = usePayInvoiceMutation();

  if (invoice.status === 'draft') {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled={sending.isLoading}
        aria-label={`Send ${invoice.number}`}
        onClick={() => void sendInvoice(invoice.id)}
      >
        Send
      </Button>
    );
  }
  if (invoice.status === 'sent') {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled={paying.isLoading}
        aria-label={`Mark paid ${invoice.number}`}
        onClick={() => void payInvoice(invoice.id)}
      >
        Mark paid
      </Button>
    );
  }
  return null;
}

export function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  if (invoices.length === 0) {
    return <p className="text-sm text-muted-foreground">No invoices yet. Create the first one.</p>;
  }

  const outstanding = invoices
    .filter((invoice) => invoice.status === 'sent')
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Number</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-0">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">{invoice.number}</TableCell>
              <TableCell>{invoice.customer}</TableCell>
              <TableCell>{formatMoney(invoice.amount)}</TableCell>
              <TableCell>
                <Badge variant={statusVariant[invoice.status]}>
                  {INVOICE_STATUS_LABELS[invoice.status]}
                </Badge>
              </TableCell>
              <TableCell className="flex justify-end">
                <InvoiceAction invoice={invoice} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-sm text-muted-foreground">Outstanding: {formatMoney(outstanding)}</p>
    </div>
  );
}
