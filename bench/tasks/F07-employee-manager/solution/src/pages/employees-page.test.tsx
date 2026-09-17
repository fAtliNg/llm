import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('Employees', () => {
  it('lists the employees from the API', async () => {
    renderApp(['/employees']);

    const row = await screen.findByRole('row', { name: /^Katherine Johnson/ });
    expect(within(row).getByText('Engineering')).toBeInTheDocument();
    expect(within(row).getByText('2024-03-01')).toBeInTheDocument();
  });

  it('creates an employee and returns to the list', async () => {
    const { user } = renderApp(['/employees/new']);

    await user.type(await screen.findByLabelText('Name'), 'Margaret Hamilton');
    await user.type(screen.getByLabelText('Email'), 'margaret@example.com');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByRole('heading', { name: 'Employees' })).toBeInTheDocument();
    const row = await screen.findByRole('row', { name: /Margaret Hamilton/ });
    expect(within(row).getAllByText('—')).toHaveLength(2);
  });

  it('picks a manager and shows the name in the list', async () => {
    const { user } = renderApp(['/employees/new']);

    await user.type(await screen.findByLabelText('Name'), 'Grace Hopper');
    await user.type(screen.getByLabelText('Email'), 'grace@example.com');
    await user.click(screen.getByRole('combobox', { name: 'Manager' }));
    await user.click(await screen.findByRole('option', { name: 'Dieter Rams' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    const row = await screen.findByRole('row', { name: /Grace Hopper/ });
    expect(within(row).getByText('Dieter Rams')).toBeInTheDocument();
  });
});
