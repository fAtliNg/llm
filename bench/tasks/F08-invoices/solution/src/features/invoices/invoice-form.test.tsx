import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { InvoiceForm } from '@/features/invoices/invoice-form';
import { renderWithProviders } from '@/test/render';

describe('InvoiceForm', () => {
  it('shows validation errors and does not submit an empty form', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<InvoiceForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Use the format INV-0001')).toBeInTheDocument();
    expect(screen.getByText('Customer is required')).toBeInTheDocument();
    expect(screen.getByText('Enter an amount')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the amount as a number', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<InvoiceForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Number'), 'INV-0100');
    await user.type(screen.getByLabelText('Customer'), 'Initech');
    await user.type(screen.getByLabelText('Amount'), '99.9');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      number: 'INV-0100',
      customer: 'Initech',
      amount: 99.9,
    });
  });
});
