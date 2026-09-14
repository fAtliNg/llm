import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('T21 not-found path', () => {
  it('names the requested path', async () => {
    renderApp(['/nowhere/at/all']);
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByText('No page at /nowhere/at/all')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to tasks' })).toHaveAttribute('href', '/');
  });
});
