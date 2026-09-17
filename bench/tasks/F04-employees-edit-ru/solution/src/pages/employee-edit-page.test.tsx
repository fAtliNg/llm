import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('Editing and deleting employees', () => {
  it('edits an employee from the list', async () => {
    const { user } = renderApp(['/employees']);

    await user.click(await screen.findByRole('link', { name: 'Edit Dieter Rams' }));
    expect(await screen.findByRole('heading', { name: 'Edit employee' })).toBeInTheDocument();

    const name = screen.getByLabelText('Name');
    expect(name).toHaveValue('Dieter Rams');
    await user.clear(name);
    await user.type(name, 'Dieter R.');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('row', { name: /Dieter R\./ })).toBeInTheDocument();
  });

  it('shows the API message when the email is taken', async () => {
    const { user } = renderApp(['/employees/2/edit']);

    const email = await screen.findByLabelText('Email');
    await user.clear(email);
    await user.type(email, 'katherine@example.com');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('An employee with this email already exists'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Edit employee' })).toBeInTheDocument();
  });

  it('shows a message for an unknown employee', async () => {
    renderApp(['/employees/999/edit']);
    expect(await screen.findByText('Employee not found')).toBeInTheDocument();
  });

  it('deletes an employee after confirmation', async () => {
    const { user } = renderApp(['/employees']);

    await user.click(await screen.findByRole('button', { name: 'Delete Dieter Rams' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete employee?' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByRole('row', { name: /Katherine Johnson/ })).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /Dieter Rams/ })).not.toBeInTheDocument();
  });
});
