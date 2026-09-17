import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

const dollars = (text: string) => Number(text.replace(/[^0-9.]/g, ''));

async function outstanding() {
  const line = await screen.findByText(/^Outstanding: \$/);
  return dollars(line.textContent);
}

async function create(user: UserEvent, number: string, customer: string, amount: string) {
  await user.click(await screen.findByRole('link', { name: 'New invoice' }));
  await user.type(await screen.findByLabelText('Number'), number);
  await user.type(screen.getByLabelText('Customer'), customer);
  await user.type(screen.getByLabelText('Amount'), amount);
  await user.click(screen.getByRole('button', { name: 'Create' }));
}

describe('F08 invoices in the web app', () => {
  it('is reachable from the main navigation', async () => {
    const { user } = renderApp(['/']);
    const nav = await screen.findByRole('navigation', { name: 'Main' });
    await user.click(within(nav).getByRole('link', { name: 'Invoices' }));
    expect(await screen.findByRole('heading', { name: 'Invoices' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'New invoice' })).toBeInTheDocument();
  });

  it('creates a draft, formats the money and walks it through the statuses', async () => {
    const { user } = renderApp(['/invoices']);
    const before = await outstanding();

    await create(user, 'INV-8206', 'Bench Lambda-206', '2340.5');
    const row = await screen.findByRole('row', { name: /INV-8206/ });
    expect(within(row).getByText('Bench Lambda-206')).toBeInTheDocument();
    expect(within(row).getByText('$2,340.50')).toBeInTheDocument();
    expect(within(row).getByText('Draft')).toBeInTheDocument();
    expect(await outstanding()).toBeCloseTo(before, 2);

    await user.click(screen.getByRole('button', { name: 'Send INV-8206' }));
    await within(row).findByText('Sent');
    expect(await outstanding()).toBeCloseTo(before + 2340.5, 2);
    expect(screen.queryByRole('button', { name: 'Send INV-8206' })).not.toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'Mark paid INV-8206' }));
    await within(row).findByText('Paid');
    expect(await outstanding()).toBeCloseTo(before, 2);
    expect(within(row).queryByRole('button', { name: /INV-8206/ })).not.toBeInTheDocument();
  });

  it('validates the form before sending anything', async () => {
    const { user } = renderApp(['/invoices/new']);
    await user.type(await screen.findByLabelText('Number'), '8206');
    await user.type(screen.getByLabelText('Amount'), '0');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Use the format INV-0001')).toBeInTheDocument();
    expect(screen.getByText('Customer is required')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('shows a taken number under the field and keeps the form open', async () => {
    const { user } = renderApp(['/invoices']);
    await create(user, 'INV-8553', 'Bench Mu-553', '10');
    await screen.findByRole('row', { name: /INV-8553/ });

    await create(user, 'INV-8553', 'Bench Nu-847', '20');
    expect(
      await screen.findByText('An invoice with this number already exists'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Customer')).toHaveValue('Bench Nu-847');
  });
});
