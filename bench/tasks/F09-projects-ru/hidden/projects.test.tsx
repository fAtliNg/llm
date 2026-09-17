import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

async function createProject(user: UserEvent, name: string) {
  const nav = await screen.findByRole('navigation', { name: 'Main' });
  await user.click(within(nav).getByRole('link', { name: 'Projects' }));
  await user.click(await screen.findByRole('link', { name: 'New project' }));
  await user.type(await screen.findByLabelText('Name'), name);
  await user.click(screen.getByRole('button', { name: 'Create' }));
  return screen.findByRole('row', { name: new RegExp(`^${name}`) });
}

async function createTask(user: UserEvent, title: string, project?: string) {
  const nav = screen.getByRole('navigation', { name: 'Main' });
  await user.click(within(nav).getByRole('link', { name: 'New task' }));
  await user.type(await screen.findByLabelText('Title'), title);
  if (project) {
    await user.click(screen.getByRole('combobox', { name: 'Project' }));
    await user.click(await screen.findByRole('option', { name: project }));
  }
  await user.click(screen.getByRole('button', { name: 'Create' }));
  return screen.findByRole('row', { name: new RegExp(`^${title}`) });
}

describe('F09 projects in the web app', () => {
  it('creates a project from the navigation and shows it with zero tasks', async () => {
    const { user } = renderApp(['/']);
    const row = await createProject(user, 'Bench Pi-604');
    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Tasks' })).toBeInTheDocument();
    expect(within(row).getByText('0')).toBeInTheDocument();
  });

  it('validates the project form', async () => {
    const { user } = renderApp(['/projects/new']);
    await user.click(await screen.findByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Name is required')).toBeInTheDocument();
  });

  it('creates tasks with and without a project and shows the names in the tasks table', async () => {
    const { user } = renderApp(['/']);
    await createProject(user, 'Bench Rho-127');

    const withProject = await createTask(user, 'Bench Task-771', 'Bench Rho-127');
    expect(await within(withProject).findByText('Bench Rho-127')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Project' })).toBeInTheDocument();

    const without = await createTask(user, 'Bench Task-772');
    expect(within(without).getByText('—')).toBeInTheDocument();
    expect(within(without).queryByText('No project')).not.toBeInTheDocument();
  });

  it('keeps the counts fresh without a reload', async () => {
    const { user } = renderApp(['/']);
    await createProject(user, 'Bench Sigma-471');
    await createTask(user, 'Bench Task-881', 'Bench Sigma-471');
    await createTask(user, 'Bench Task-882', 'Bench Sigma-471');

    const nav = screen.getByRole('navigation', { name: 'Main' });
    await user.click(within(nav).getByRole('link', { name: 'Projects' }));
    const row = await screen.findByRole('row', { name: /^Bench Sigma-471/ });
    expect(await within(row).findByText('2')).toBeInTheDocument();
  });

  it('moves a task to another project on the edit page', async () => {
    const { user } = renderApp(['/']);
    await createProject(user, 'Bench Tau-902');
    await createProject(user, 'Bench Phi-118');
    const row = await createTask(user, 'Bench Task-991', 'Bench Tau-902');

    await user.click(within(row).getByRole('link', { name: 'Edit' }));
    const select = await screen.findByRole('combobox', { name: 'Project' });
    expect(select).toHaveTextContent('Bench Tau-902');
    await user.click(select);
    await user.click(await screen.findByRole('option', { name: 'Bench Phi-118' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    const moved = await screen.findByRole('row', { name: /^Bench Task-991/ });
    expect(await within(moved).findByText('Bench Phi-118')).toBeInTheDocument();
  });
});
