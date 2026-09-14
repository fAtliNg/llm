import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('T19 title search', () => {
  it('filters rows by title, case-insensitively', async () => {
    const { user } = renderApp(['/']);
    await screen.findByText('Set up the project');
    const search = screen.getByLabelText('Search');

    await user.type(search, 'TEST');
    await waitFor(() => {
      expect(screen.getAllByRole('row')).toHaveLength(2);
    });
    expect(screen.getByText('Add tests')).toBeInTheDocument();

    await user.clear(search);
    await waitFor(() => {
      expect(screen.getAllByRole('row')).toHaveLength(4);
    });
  });
});
