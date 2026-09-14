import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TaskForm } from '@/features/tasks/task-form';
import { renderApp, renderWithProviders } from '@/test/render';

describe('T24 task labels', () => {
  it('creates a task with labels and shows them in the list', async () => {
    const { user } = renderApp(['/tasks/new']);
    await user.type(await screen.findByLabelText('Title'), 'Labelled task');
    await user.type(screen.getByLabelText('Labels'), 'frontend, urgent');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    const row = (await screen.findByText('Labelled task')).closest('tr')!;
    expect(within(row).getByText('frontend')).toBeInTheDocument();
    expect(within(row).getByText('urgent')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(5);
  });

  it('submits an empty label list when the field is blank', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<TaskForm onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText('Title'), 'No labels');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledOnce();
    const values = onSubmit.mock.calls[0]?.[0] as { labels?: string[] };
    expect(values.labels ?? []).toEqual([]);
  });

  it('is accepted by the mock API', async () => {
    const response = await fetch('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Via API',
        description: '',
        status: 'todo',
        priority: 'low',
        labels: ['api'],
      }),
    });
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ title: 'Via API', labels: ['api'] });
  });
});
