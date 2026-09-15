import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('T13 task count', () => {
  it('shows the count and updates it after a delete', async () => {
    const { user } = renderApp(['/']);
    expect(await screen.findByRole('heading', { name: 'Tasks (3)' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete Add tests' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete task?' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Tasks (2)' })).toBeInTheDocument();
    });
  });
});
