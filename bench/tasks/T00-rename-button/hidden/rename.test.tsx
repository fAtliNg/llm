import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('T00 rename button', () => {
  it('shows an "Add task" button on the tasks page and keeps the nav link', async () => {
    renderApp(['/']);
    const main = await screen.findByRole('main');
    expect(within(main).getByRole('link', { name: 'Add task' })).toHaveAttribute(
      'href',
      '/tasks/new',
    );
    expect(within(main).queryByRole('link', { name: 'New task' })).not.toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'New task' })).toBeInTheDocument();
  });
});
