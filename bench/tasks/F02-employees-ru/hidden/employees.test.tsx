import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('F02 employees in the web app', () => {
  it('is reachable from the main navigation', async () => {
    const { user } = renderApp(['/']);
    const nav = await screen.findByRole('navigation', { name: 'Main' });
    await user.click(within(nav).getByRole('link', { name: 'Employees' }));
    expect(await screen.findByRole('heading', { name: 'Employees' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'New employee' })).toBeInTheDocument();
  });

  it('creates an employee through the form and shows it in the table', async () => {
    const { user } = renderApp(['/employees/new']);

    await user.type(await screen.findByLabelText('Name'), 'Bench Lambda-206');
    await user.type(screen.getByLabelText('Email'), 'lambda-206@bench.test');
    await user.click(screen.getByRole('combobox', { name: 'Department' }));
    await user.click(await screen.findByRole('option', { name: 'Sales' }));
    await user.type(screen.getByLabelText('Start date'), '2030-09-10');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    const row = await screen.findByRole('row', { name: /Bench Lambda-206/ });
    expect(within(row).getByText('lambda-206@bench.test')).toBeInTheDocument();
    expect(within(row).getByText('Sales')).toBeInTheDocument();
    expect(within(row).getByText('2030-09-10')).toBeInTheDocument();
  });

  it('shows a dash when there is no start date', async () => {
    const { user } = renderApp(['/employees/new']);

    await user.type(await screen.findByLabelText('Name'), 'Bench Mu-553');
    await user.type(screen.getByLabelText('Email'), 'mu-553@bench.test');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    const row = await screen.findByRole('row', { name: /Bench Mu-553/ });
    expect(within(row).getByText('—')).toBeInTheDocument();
  });

  it('validates the form before sending anything', async () => {
    const { user } = renderApp(['/employees/new']);

    await user.type(await screen.findByLabelText('Email'), 'nope');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
  });
});
