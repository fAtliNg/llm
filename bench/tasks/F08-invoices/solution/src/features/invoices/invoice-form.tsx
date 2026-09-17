import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { invoiceInputSchema, type InvoiceInput } from '@/features/invoices/model';

interface InvoiceFormProps {
  defaultValues?: Partial<InvoiceInput>;
  onSubmit: (values: InvoiceInput) => Promise<void> | void;
  submitLabel?: string;
}

const emptyInvoice: InvoiceInput = { number: '', customer: '', amount: Number.NaN };

function conflictMessage(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('status' in error)) return undefined;
  if (error.status !== 409 || !('data' in error)) return undefined;
  const { data } = error;
  if (typeof data !== 'object' || data === null || !('message' in data)) return undefined;
  return typeof data.message === 'string' ? data.message : undefined;
}

export function InvoiceForm({ defaultValues, onSubmit, submitLabel = 'Save' }: InvoiceFormProps) {
  const form = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceInputSchema),
    defaultValues: { ...emptyInvoice, ...defaultValues },
  });

  /** A 409 from the API means the number is taken: show the API message under the field. */
  async function handleValid(values: InvoiceInput) {
    try {
      await onSubmit(values);
    } catch (error) {
      const message = conflictMessage(error);
      if (!message) throw error;
      form.setError('number', { message });
    }
  }

  return (
    <form
      noValidate
      onSubmit={(event) => void form.handleSubmit(handleValid)(event)}
      className="max-w-lg"
    >
      <FieldGroup>
        <Controller
          name="number"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="invoice-number">Number</FieldLabel>
              <Input
                {...field}
                id="invoice-number"
                placeholder="INV-0001"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="customer"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="invoice-customer">Customer</FieldLabel>
              <Input {...field} id="invoice-customer" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="amount"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="invoice-amount">Amount</FieldLabel>
              <Input
                {...field}
                id="invoice-amount"
                type="number"
                step="0.01"
                min="0"
                value={Number.isNaN(field.value) ? '' : field.value}
                onChange={(event) => {
                  field.onChange(event.target.valueAsNumber);
                }}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Field orientation="horizontal">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {submitLabel}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
