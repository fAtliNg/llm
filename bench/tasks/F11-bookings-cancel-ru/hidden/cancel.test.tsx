import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

async function book(title: string, date: string) {
  const view = renderApp(['/bookings/new']);
  await view.user.type(await screen.findByLabelText('Title'), title);
  await view.user.type(screen.getByLabelText('Date'), date);
  await view.user.click(screen.getByRole('button', { name: 'Book' }));
  await screen.findByRole('row', { name: new RegExp(`^${title}`) });
  return view;
}

describe('F11 cancelling bookings in the web app', () => {
  it('keeps the booking when the dialog is dismissed', async () => {
    const { user } = await book('Bench Sigma-471', '2032-05-06');

    await user.click(screen.getByRole('button', { name: 'Cancel Bench Sigma-471' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cancel booking?' });
    await user.click(within(dialog).getByRole('button', { name: 'Keep' }));

    const row = screen.getByRole('row', { name: /^Bench Sigma-471/ });
    expect(within(row).queryByText('Cancelled')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel Bench Sigma-471' })).toBeInTheDocument();
  });

  it('cancels after confirmation and shows the badge without a reload', async () => {
    const { user } = await book('Bench Tau-902', '2032-05-07');

    await user.click(screen.getByRole('button', { name: 'Cancel Bench Tau-902' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cancel booking?' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel booking' }));

    const row = await screen.findByRole('row', { name: /^Bench Tau-902/ });
    expect(await within(row).findByText('Cancelled')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel Bench Tau-902' })).not.toBeInTheDocument();
  });

  it('lets someone else take the slot of a cancelled booking', async () => {
    const { user } = await book('Bench Phi-118', '2032-05-08');
    await user.click(screen.getByRole('button', { name: 'Cancel Bench Phi-118' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cancel booking?' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel booking' }));
    await within(await screen.findByRole('row', { name: /^Bench Phi-118/ })).findByText('Cancelled');

    await user.click(screen.getByRole('link', { name: 'New booking' }));
    await user.type(await screen.findByLabelText('Title'), 'Bench Chi-640');
    await user.type(screen.getByLabelText('Date'), '2032-05-08');
    await user.click(screen.getByRole('button', { name: 'Book' }));

    expect(await screen.findByRole('row', { name: /^Bench Chi-640/ })).toBeInTheDocument();
  });
});
