import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/mocks/server';
import { renderApp } from '@/test/render';

describe('T31 empty state call to action', () => {
  it('links to the new task page when the list is empty', async () => {
    server.use(http.get('/api/tasks', () => HttpResponse.json([])));
    renderApp(['/']);
    expect(await screen.findByRole('link', { name: 'Create the first task' })).toHaveAttribute(
      'href',
      '/tasks/new',
    );
  });
});
