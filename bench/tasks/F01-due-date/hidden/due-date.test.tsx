import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('F01 due date in the web app', () => {
  it('creates a task with a due date and shows it in the Due column', async () => {
    const { user } = renderApp(['/tasks/new']);

    await user.type(await screen.findByLabelText('Title'), 'Bench omega-582');
    await user.type(screen.getByLabelText('Due date'), '2031-07-08');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    const row = (await screen.findByText('Bench omega-582')).closest('tr');
    expect(row).not.toBeNull();
    expect(within(row!).getByText('2031-07-08')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Due' })).toBeInTheDocument();
  });

  it('shows a dash for a task created without a due date', async () => {
    const { user } = renderApp(['/tasks/new']);

    await user.type(await screen.findByLabelText('Title'), 'Bench sigma-903');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    const row = (await screen.findByText('Bench sigma-903')).closest('tr');
    expect(within(row!).getByText('—')).toBeInTheDocument();
  });
});
