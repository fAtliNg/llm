import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('Contacts', () => {
  it('lists the contacts from the API', async () => {
    renderApp(['/contacts']);

    const row = await screen.findByRole('row', { name: /^Grace Hopper/ });
    expect(within(row).getByText('grace@example.com')).toBeInTheDocument();
  });

  it('creates a contact and returns to the list', async () => {
    const { user } = renderApp(['/contacts/new']);

    await user.type(await screen.findByLabelText('Name'), 'Sample value');
    await user.type(screen.getByLabelText('Email'), 'sample@example.com');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByRole('heading', { name: 'Contacts' })).toBeInTheDocument();
    expect(await screen.findByRole('row', { name: /^Sample value/ })).toBeInTheDocument();
  });

  it('searches on the server and says when nothing matches', async () => {
    const { user } = renderApp(['/contacts']);

    await user.type(await screen.findByLabelText('Search'), 'hopp');
    expect(await screen.findByRole('row', { name: /^Grace Hopper/ })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('row', { name: /^Alan Kay/ })).not.toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Search'), 'zzz');
    expect(await screen.findByText('No matches')).toBeInTheDocument();
  });

  it('moves a contact to the top when it becomes a favourite', async () => {
    const { user } = renderApp(['/contacts']);

    await user.click(await screen.findByRole('button', { name: 'Add Grace Hopper to favourites' }));
    expect(
      await screen.findByRole('button', { name: 'Remove Grace Hopper from favourites' }),
    ).toBeInTheDocument();

    const names = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => row.textContent);
    expect(names[0]).toMatch(/^Barbara Liskov/);
    expect(names[1]).toMatch(/^Grace Hopper/);
  });
});
