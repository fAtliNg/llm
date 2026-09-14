import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('T20 mark done', () => {
  it('marks a task done from the list', async () => {
    const { user } = renderApp(['/']);
    await screen.findByText('Add tests');

    const rowOf = (title: string) => screen.getByText(title).closest('tr')!;
    expect(
      within(rowOf('Add tests')).getByRole('button', { name: 'Mark done Add tests' }),
    ).toBeInTheDocument();
    expect(
      within(rowOf('Set up the project')).queryByRole('button', { name: /mark done/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mark done Add tests' }));
    await waitFor(() => {
      expect(within(rowOf('Add tests')).getByText('Done')).toBeInTheDocument();
    });
    expect(
      within(rowOf('Add tests')).queryByRole('button', { name: /mark done/i }),
    ).not.toBeInTheDocument();
  });
});
