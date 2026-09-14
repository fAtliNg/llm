import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/mocks/server';
import { renderApp } from '@/test/render';

describe('T10 create error', () => {
  it('shows the error and keeps the values', async () => {
    server.use(
      http.post('/api/tasks', () => HttpResponse.json({ message: 'boom' }, { status: 500 })),
    );
    const { user } = renderApp(['/tasks/new']);
    await user.type(await screen.findByLabelText('Title'), 'Keep me');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Could not save the task')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('Keep me');
    expect(screen.getByRole('heading', { name: 'New task' })).toBeInTheDocument();
  });
});
