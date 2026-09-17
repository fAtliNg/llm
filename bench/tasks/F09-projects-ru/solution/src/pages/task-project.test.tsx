import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('Tasks and projects', () => {
  it('shows the project of every task', async () => {
    renderApp(['/']);

    const withProject = await screen.findByRole('row', { name: /^Set up the project/ });
    expect(await within(withProject).findByText('Website')).toBeInTheDocument();
    const without = screen.getByRole('row', { name: /^Add tests/ });
    expect(within(without).getByText('—')).toBeInTheDocument();
  });

  it('creates a task in a project and counts it on the projects page', async () => {
    const { user } = renderApp(['/tasks/new']);

    await user.type(await screen.findByLabelText('Title'), 'Design the icon');
    await user.click(screen.getByRole('combobox', { name: 'Project' }));
    await user.click(await screen.findByRole('option', { name: 'Mobile app' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    const row = await screen.findByRole('row', { name: /^Design the icon/ });
    expect(await within(row).findByText('Mobile app')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Projects' }));
    const project = await screen.findByRole('row', { name: /^Mobile app/ });
    expect(await within(project).findByText('1')).toBeInTheDocument();
  });
});
