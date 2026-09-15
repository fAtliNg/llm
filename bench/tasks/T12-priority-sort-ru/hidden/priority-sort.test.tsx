import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/mocks/server';
import { renderApp } from '@/test/render';

describe('T12 priority sort', () => {
  it('orders rows high, medium, low regardless of API order', async () => {
    server.use(
      http.get('/api/tasks', () =>
        HttpResponse.json([
          { id: '1', title: 'Low one', description: '', status: 'todo', priority: 'low' },
          { id: '2', title: 'High one', description: '', status: 'todo', priority: 'high' },
          { id: '3', title: 'Medium one', description: '', status: 'todo', priority: 'medium' },
          { id: '4', title: 'High two', description: '', status: 'done', priority: 'high' },
        ]),
      ),
    );
    renderApp(['/']);
    await screen.findByText('Low one');
    const rows = screen.getAllByRole('row').slice(1);
    const titles = rows.map((row) => within(row).getAllByRole('cell')[0]?.textContent?.trim());
    expect(titles).toEqual(['High one', 'High two', 'Medium one', 'Low one']);
  });
});
