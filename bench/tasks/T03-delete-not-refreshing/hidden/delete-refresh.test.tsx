import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('T03 delete refreshes the list', () => {
  it('removes the row without a reload', async () => {
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
