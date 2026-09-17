import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('Invoices', () => {
  it('lists the invoices with money and the outstanding total', async () => {
    renderApp(['/invoices']);

    const row = await screen.findByRole('row', { name: /INV-0001/ });
    expect(within(row).getByText('$1,250.00')).toBeInTheDocument();
    expect(within(row).getByText('Sent')).toBeInTheDocument();
    expect(screen.getByText('Outstanding: $1,250.00')).toBeInTheDocument();
  });

  it('sends a draft and marks it paid', async () => {
    const { user } = renderApp(['/invoices']);

    await user.click(await screen.findByRole('button', { name: 'Send INV-0002' }));
    expect(await screen.findByText('Outstanding: $1,730.50')).toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'Mark paid INV-0002' }));
    expect(await screen.findByText('Outstanding: $1,250.00')).toBeInTheDocument();
    const row = screen.getByRole('row', { name: /INV-0002/ });
    expect(within(row).getByText('Paid')).toBeInTheDocument();
    expect(within(row).queryByRole('button')).not.toBeInTheDocument();
  });

  it('creates a draft and shows a taken number under the field', async () => {
    const { user } = renderApp(['/invoices/new']);

    await user.type(await screen.findByLabelText('Number'), 'INV-0001');
    await user.type(screen.getByLabelText('Customer'), 'Initech');
    await user.type(screen.getByLabelText('Amount'), '10');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(
      await screen.findByText('An invoice with this number already exists'),
    ).toBeInTheDocument();

    const number = screen.getByLabelText('Number');
    await user.clear(number);
    await user.type(number, 'INV-0100');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    const row = await screen.findByRole('row', { name: /INV-0100/ });
    expect(within(row).getByText('Draft')).toBeInTheDocument();
  });
});
