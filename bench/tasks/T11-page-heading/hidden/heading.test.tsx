import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('T11 page heading', () => {
  it('shows the new heading and keeps the nav link', async () => {
    renderApp(['/']);
    expect(await screen.findByRole('heading', { name: 'My tasks' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Tasks' })).toBeInTheDocument();
  });
});
