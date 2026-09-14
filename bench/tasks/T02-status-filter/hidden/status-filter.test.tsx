import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('T02 status filter', () => {
  it('filters rows by the selected status and restores them with All', async () => {
    const { user } = renderApp(['/']);
    await screen.findByText('Set up the project');
    expect(screen.getAllByRole('row')).toHaveLength(4);

    await user.click(screen.getByRole('combobox', { name: 'Filter by status' }));
    await user.click(await screen.findByRole('option', { name: 'Done' }));
    await waitFor(() => {
      expect(screen.getAllByRole('row')).toHaveLength(2);
    });
    expect(screen.getByText('Set up the project')).toBeInTheDocument();
    expect(screen.queryByText('Add tests')).not.toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: 'Filter by status' }));
    await user.click(await screen.findByRole('option', { name: 'All' }));
    await waitFor(() => {
      expect(screen.getAllByRole('row')).toHaveLength(4);
    });
  });
});
