import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/mocks/server';
import { renderApp } from '@/test/render';

describe('T30 delete error', () => {
  it('keeps the dialog open with a message and the task in the list', async () => {
    server.use(
      http.delete('/api/tasks/:taskId', () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );
    const { user } = renderApp(['/']);
    await screen.findByText('Add tests');
    await user.click(screen.getByRole('button', { name: 'Delete Add tests' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete task?' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await within(dialog).findByText('Could not delete the task')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Delete task?' })).toBeInTheDocument();
    expect(screen.getByText('Add tests')).toBeInTheDocument();
  });
});
