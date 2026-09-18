import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

async function fill(
  user: UserEvent,
  values: { title: string; room?: string; date: string; start: string; end: string },
) {
  await user.type(await screen.findByLabelText('Title'), values.title);
  if (values.room) {
    await user.click(screen.getByRole('combobox', { name: 'Room' }));
    await user.click(await screen.findByRole('option', { name: values.room }));
  }
  await user.type(screen.getByLabelText('Date'), values.date);
  const start = screen.getByLabelText('Start hour');
  await user.clear(start);
  await user.type(start, values.start);
  const end = screen.getByLabelText('End hour');
  await user.clear(end);
  await user.type(end, values.end);
}

describe('F05 bookings in the web app', () => {
  it('is reachable from the main navigation', async () => {
    const { user } = renderApp(['/']);
    const nav = await screen.findByRole('navigation', { name: 'Main' });
    await user.click(within(nav).getByRole('link', { name: 'Bookings' }));
    expect(await screen.findByRole('heading', { name: 'Bookings' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'New booking' })).toBeInTheDocument();
  });

  it('books a room through the form and shows it in the table', async () => {
    const { user } = renderApp(['/bookings/new']);
    await fill(user, {
      title: 'Bench Lambda-206',
      room: 'Cosmos',
      date: '2031-09-10',
      start: '9',
      end: '11',
    });
    await user.click(screen.getByRole('button', { name: 'Book' }));

    const row = await screen.findByRole('row', { name: /Bench Lambda-206/ });
    expect(within(row).getByText('Cosmos')).toBeInTheDocument();
    // The prompt does not fix the date format: any rendering of that date is fine.
    expect(within(row).getByText(/2031|10\.09|Sep/)).toBeInTheDocument();
    expect(within(row).getByText(/9:00–11:00/)).toBeInTheDocument();
  });

  it('validates the form before sending anything', async () => {
    const { user } = renderApp(['/bookings/new']);
    await fill(user, { title: ' ', date: '2031-09-11', start: '12', end: '12' });
    await user.click(screen.getByRole('button', { name: 'Book' }));

    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('End must be after start')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Book' })).toBeInTheDocument();
  });

  it('shows the conflict from the API and stays on the form', async () => {
    const { user } = renderApp(['/bookings/new']);
    await fill(user, {
      title: 'Bench Mu-553',
      room: 'Borealis',
      date: '2031-09-12',
      start: '14',
      end: '16',
    });
    await user.click(screen.getByRole('button', { name: 'Book' }));
    await screen.findByRole('row', { name: /Bench Mu-553/ });

    await user.click(screen.getByRole('link', { name: 'New booking' }));
    await fill(user, {
      title: 'Bench Nu-847',
      room: 'Borealis',
      date: '2031-09-12',
      start: '15',
      end: '17',
    });
    await user.click(screen.getByRole('button', { name: 'Book' }));

    expect(await screen.findByText('This room is already booked for that time')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('Bench Nu-847');
  });
});
