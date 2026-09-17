import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('Employees', () => {
  it('lists the employees from the API', async () => {
    renderApp(['/employees']);

    const row = await screen.findByRole('row', { name: /Katherine Johnson/ });
    expect(within(row).getByText('Engineering')).toBeInTheDocument();
    expect(within(row).getByText('2024-03-01')).toBeInTheDocument();
  });

  it('filters the list by department', async () => {
    const { user } = renderApp(['/employees']);
    await screen.findByText('Katherine Johnson');

    await user.click(screen.getByRole('combobox', { name: 'Filter by department' }));
    await user.click(await screen.findByRole('option', { name: 'Design' }));

    expect(await screen.findByText('Dieter Rams')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('Katherine Johnson')).not.toBeInTheDocument();
    });
  });

  it('creates an employee and returns to the list', async () => {
    const { user } = renderApp(['/employees/new']);

    await user.type(await screen.findByLabelText('Name'), 'Margaret Hamilton');
    await user.type(screen.getByLabelText('Email'), 'margaret@example.com');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByRole('heading', { name: 'Employees' })).toBeInTheDocument();
    const row = await screen.findByRole('row', { name: /Margaret Hamilton/ });
    expect(within(row).getByText('—')).toBeInTheDocument();
  });
});
