import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/mocks/server';
import { renderApp } from '@/test/render';

describe('T27 refresh button', () => {
  it('refetches the list', async () => {
    const { user } = renderApp(['/']);
    await screen.findByText('Set up the project');
    expect(screen.getAllByRole('row')).toHaveLength(4);

    server.use(
      http.get('/api/tasks', () =>
        HttpResponse.json([
          { id: '9', title: 'Fresh from server', description: '', status: 'todo', priority: 'low' },
        ]),
      ),
    );
    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(await screen.findByText('Fresh from server')).toBeInTheDocument();
    expect(screen.queryByText('Set up the project')).not.toBeInTheDocument();
  });
});
