import { screen, waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

async function create(user: UserEvent, name: string, email: string, phone?: string) {
  await user.click(await screen.findByRole('link', { name: 'New contact' }));
  await user.type(await screen.findByLabelText('Name'), name);
  await user.type(screen.getByLabelText('Email'), email);
  if (phone) await user.type(screen.getByLabelText('Phone'), phone);
  await user.click(screen.getByRole('button', { name: 'Create' }));
  return screen.findByRole('row', { name: new RegExp(`^${name}`) });
}

const rowNames = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => row.textContent);

describe('F10 contacts in the web app', () => {
  it('is reachable from the main navigation', async () => {
    const { user } = renderApp(['/']);
    const nav = await screen.findByRole('navigation', { name: 'Main' });
    await user.click(within(nav).getByRole('link', { name: 'Contacts' }));
    expect(await screen.findByRole('heading', { name: 'Contacts' })).toBeInTheDocument();
  });

  it('creates contacts with and without a phone', async () => {
    const { user } = renderApp(['/contacts']);
    const withPhone = await create(user, 'Bench Lambda-206', 'lambda-206@bench.test', '+79001234567');
    expect(within(withPhone).getByText('+79001234567')).toBeInTheDocument();
    expect(within(withPhone).getByText('Friends')).toBeInTheDocument();

    const without = await create(user, 'Bench Mu-553', 'mu-553@bench.test');
    expect(within(without).getByText('—')).toBeInTheDocument();
  });

  it('validates the form before sending anything', async () => {
    const { user } = renderApp(['/contacts/new']);
    await user.type(await screen.findByLabelText('Email'), 'nope');
    await user.type(screen.getByLabelText('Phone'), '12345');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('Use the format +123456789')).toBeInTheDocument();
  });

  it('moves a new favourite above the others and back', async () => {
    const { user } = renderApp(['/contacts']);
    await create(user, 'Zz Bench Nu-847', 'nu-847@bench.test');
    await create(user, 'Zz Bench Xi-112', 'xi-112@bench.test');

    await user.click(screen.getByRole('button', { name: 'Add Zz Bench Xi-112 to favourites' }));
    await screen.findByRole('button', { name: 'Remove Zz Bench Xi-112 from favourites' });
    await waitFor(() => {
      const names = rowNames();
      const xi = names.findIndex((text) => text.startsWith('Zz Bench Xi-112'));
      const nu = names.findIndex((text) => text.startsWith('Zz Bench Nu-847'));
      expect(xi).toBeLessThan(nu);
    });

    await user.click(screen.getByRole('button', { name: 'Remove Zz Bench Xi-112 from favourites' }));
    await screen.findByRole('button', { name: 'Add Zz Bench Xi-112 to favourites' });
    await waitFor(() => {
      const names = rowNames();
      const xi = names.findIndex((text) => text.startsWith('Zz Bench Xi-112'));
      const nu = names.findIndex((text) => text.startsWith('Zz Bench Nu-847'));
      expect(nu).toBeLessThan(xi);
    });
  });

  it('searches through the server by name and email', async () => {
    const { user } = renderApp(['/contacts']);
    await create(user, 'Bench Quokka', 'first-390@bench.test');
    await create(user, 'Bench Other', 'wombat-77@bench.test');

    const search = screen.getByLabelText('Search');
    await user.type(search, 'quokka');
    await waitFor(() => {
      expect(screen.queryByRole('row', { name: /^Bench Other/ })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('row', { name: /^Bench Quokka/ })).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'WOMBAT-77');
    expect(await screen.findByRole('row', { name: /^Bench Other/ })).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'no-such-text-anywhere');
    expect(await screen.findByText('No matches')).toBeInTheDocument();
  });
});
