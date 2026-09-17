import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/mocks/server';
import { renderApp } from '@/test/render';

describe('TasksPage', () => {
  it('renders the tasks returned by the API', async () => {
    renderApp(['/']);

    expect(screen.getByLabelText('Loading tasks')).toBeInTheDocument();

    const rows = await screen.findAllByRole('row');
    // Header row plus three seeded tasks.
    expect(rows).toHaveLength(4);
    expect(within(rows[1]!).getByText('Set up the project')).toBeInTheDocument();
    expect(within(rows[1]!).getByText('Done')).toBeInTheDocument();
  });

  it('shows an error state when the API fails', async () => {
    server.use(http.get('/api/tasks', () => HttpResponse.json(null, { status: 500 })));

    renderApp(['/']);

    expect(await screen.findByText('Could not load tasks')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('deletes a task after confirmation and refreshes the list', async () => {
    const { user } = renderApp(['/']);
    await screen.findByText('Add tests');

    await user.click(screen.getByRole('button', { name: 'Delete Add tests' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete task?' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(screen.getAllByRole('row')).toHaveLength(3);
    });
    expect(screen.queryByText('Add tests')).not.toBeInTheDocument();
  });
});
