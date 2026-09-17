import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

async function createEmployee(name: string, email: string) {
  const view = renderApp(['/employees/new']);
  await view.user.type(await screen.findByLabelText('Name'), name);
  await view.user.type(screen.getByLabelText('Email'), email);
  await view.user.click(screen.getByRole('button', { name: 'Create' }));
  await screen.findByRole('row', { name: new RegExp(name) });
  return view;
}

describe('F04 editing and deleting employees', () => {
  it('opens the edit page from the row, saves and returns to the list', async () => {
    const { user } = await createEmployee('Bench Sigma-471', 'sigma-471@bench.test');

    await user.click(screen.getByRole('link', { name: 'Edit Bench Sigma-471' }));
    expect(await screen.findByRole('heading', { name: 'Edit employee' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveValue('sigma-471@bench.test');

    const name = screen.getByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'Bench Tau-902');
    await user.click(screen.getByRole('combobox', { name: 'Department' }));
    await user.click(await screen.findByRole('option', { name: 'Sales' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    const row = await screen.findByRole('row', { name: /Bench Tau-902/ });
    expect(within(row).getByText('Sales')).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /Bench Sigma-471/ })).not.toBeInTheDocument();
  });

  it('shows the conflict from the API under the email field on the edit page', async () => {
    const { user } = await createEmployee('Bench Phi-118', 'phi-118@bench.test');
    await user.click(screen.getByRole('link', { name: 'New employee' }));
    await user.type(await screen.findByLabelText('Name'), 'Bench Chi-640');
    await user.type(screen.getByLabelText('Email'), 'chi-640@bench.test');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await user.click(await screen.findByRole('link', { name: 'Edit Bench Chi-640' }));
    const email = await screen.findByLabelText('Email');
    await user.clear(email);
    await user.type(email, 'phi-118@bench.test');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('An employee with this email already exists'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Edit employee' })).toBeInTheDocument();
  });

  it('shows the conflict on the create page too and keeps the values', async () => {
    const { user } = await createEmployee('Bench Psi-255', 'psi-255@bench.test');
    await user.click(screen.getByRole('link', { name: 'New employee' }));
    await user.type(await screen.findByLabelText('Name'), 'Bench Omega-733');
    await user.type(screen.getByLabelText('Email'), 'psi-255@bench.test');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      await screen.findByText('An employee with this email already exists'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Bench Omega-733');
  });

  it('saving without changing the email is not a conflict', async () => {
    const { user } = await createEmployee('Bench Alpha-064', 'alpha-064@bench.test');
    await user.click(screen.getByRole('link', { name: 'Edit Bench Alpha-064' }));
    await user.click(await screen.findByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('heading', { name: 'Employees' })).toBeInTheDocument();
  });

  it('shows a message for an unknown employee', async () => {
    renderApp(['/employees/no-such-id/edit']);
    expect(await screen.findByText('Employee not found')).toBeInTheDocument();
  });

  it('deletes only after confirmation', async () => {
    const { user } = await createEmployee('Bench Beta-389', 'beta-389@bench.test');

    await user.click(screen.getByRole('button', { name: 'Delete Bench Beta-389' }));
    let dialog = await screen.findByRole('dialog', { name: 'Delete employee?' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('row', { name: /Bench Beta-389/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete Bench Beta-389' }));
    dialog = await screen.findByRole('dialog', { name: 'Delete employee?' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await screen.findByRole('heading', { name: 'Employees' });
    await expect
      .poll(() => screen.queryByRole('row', { name: /Bench Beta-389/ }))
      .not.toBeInTheDocument();
  });
});
