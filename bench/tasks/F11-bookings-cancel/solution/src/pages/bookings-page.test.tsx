import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('Bookings', () => {
  it('lists the bookings from the API', async () => {
    renderApp(['/bookings']);

    const row = await screen.findByRole('row', { name: /Sprint planning/ });
    expect(within(row).getByText('Atlas')).toBeInTheDocument();
    expect(within(row).getByText('10:00–12:00')).toBeInTheDocument();
  });

  it('books a room and returns to the list', async () => {
    const { user } = renderApp(['/bookings/new']);

    await user.type(await screen.findByLabelText('Title'), 'Retro');
    await user.type(screen.getByLabelText('Date'), '2026-11-02');
    await user.click(screen.getByRole('button', { name: 'Book' }));

    expect(await screen.findByRole('heading', { name: 'Bookings' })).toBeInTheDocument();
    const row = await screen.findByRole('row', { name: /Retro/ });
    expect(within(row).getByText('9:00–10:00')).toBeInTheDocument();
  });

  it('shows the API message when the room is taken', async () => {
    const { user } = renderApp(['/bookings/new']);

    await user.type(await screen.findByLabelText('Title'), 'Clash');
    await user.type(screen.getByLabelText('Date'), '2026-10-05');
    const start = screen.getByLabelText('Start hour');
    await user.clear(start);
    await user.type(start, '11');
    const end = screen.getByLabelText('End hour');
    await user.clear(end);
    await user.type(end, '13');
    await user.click(screen.getByRole('button', { name: 'Book' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This room is already booked for that time',
    );
  });

  it('cancels a booking after confirmation', async () => {
    const { user } = renderApp(['/bookings']);

    await user.click(await screen.findByRole('button', { name: 'Cancel Sprint planning' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cancel booking?' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel booking' }));

    const row = await screen.findByRole('row', { name: /^Sprint planning/ });
    expect(await within(row).findByText('Cancelled')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Cancel Sprint planning' }),
    ).not.toBeInTheDocument();
  });
});
