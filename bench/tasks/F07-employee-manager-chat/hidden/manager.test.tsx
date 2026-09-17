import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('F07 manager in the web app', () => {
  it('creates a manager and a report, and shows the manager by name', async () => {
    const { user } = renderApp(['/employees/new']);

    await user.type(await screen.findByLabelText('Name'), 'Bench Boss-811');
    await user.type(screen.getByLabelText('Email'), 'boss-811@bench.test');
    expect(screen.getByRole('combobox', { name: 'Manager' })).toHaveTextContent('No manager');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    const bossRow = await screen.findByRole('row', { name: /^Bench Boss-811/ });
    expect(within(bossRow).queryByText('No manager')).not.toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'New employee' }));
    await user.type(await screen.findByLabelText('Name'), 'Bench Report-245');
    await user.type(screen.getByLabelText('Email'), 'report-245@bench.test');
    await user.click(screen.getByRole('combobox', { name: 'Manager' }));
    await user.click(await screen.findByRole('option', { name: 'Bench Boss-811' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    const row = await screen.findByRole('row', { name: /^Bench Report-245/ });
    expect(within(row).getByText('Bench Boss-811')).toBeInTheDocument();
  });

  it('has a Manager column', async () => {
    renderApp(['/employees']);
    expect(await screen.findByRole('columnheader', { name: 'Manager' })).toBeInTheDocument();
  });
});
