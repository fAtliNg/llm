import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('Employees', () => {
  it('lists the employees from the API', async () => {
    renderApp(['/employees']);

    const row = await screen.findByRole('row', { name: /Katherine Johnson/ });
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
    expect(within(row).getByText('—')).toBeInTheDocument();
  });

  it('pages through a long list', async () => {
    for (let i = 1; i <= 11; i += 1) {
      await fetch('/api/employees', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: `Aaa ${String(i).padStart(2, '0')}`,
          email: `aaa-${String(i)}@example.com`,
          department: 'sales',
          startDate: null,
        }),
      });
    }
    const { user } = renderApp(['/employees']);

    expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getAllByRole('row')).toHaveLength(11);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Page 2 of 2')).toBeInTheDocument();
    expect(await screen.findByRole('row', { name: /^Katherine Johnson/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});
