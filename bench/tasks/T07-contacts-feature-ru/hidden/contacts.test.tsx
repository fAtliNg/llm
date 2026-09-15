import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('T07 contacts', () => {
  it('has a contacts page linked from the navigation', async () => {
    renderApp(['/contacts']);
    expect(await screen.findByRole('heading', { name: 'Contacts' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Contacts' })).toHaveAttribute(
      'href',
      '/contacts',
    );
  });

  it('rejects an invalid email', async () => {
    const { user } = renderApp(['/contacts/new']);
    await user.type(await screen.findByLabelText('Name'), 'Bench Tester');
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('creates a contact and shows it in the list', async () => {
    // A name no sensible seed data would contain, so the assertion cannot collide with mocks.
    const name = 'Quintessa Bench-Zorvath';
    const email = 'quintessa.zorvath@bench.example';
    const { user } = renderApp(['/contacts/new']);
    await user.type(await screen.findByLabelText('Name'), name);
    await user.type(screen.getByLabelText('Email'), email);
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByRole('heading', { name: 'Contacts' })).toBeInTheDocument();
    expect(await screen.findByText(name)).toBeInTheDocument();
    expect(screen.getByText(email)).toBeInTheDocument();
  });
});
