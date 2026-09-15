import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('T29 redirect', () => {
  it('redirects /tasks to / with replace', async () => {
    const { router } = renderApp(['/tasks']);
    expect(await screen.findByRole('heading', { name: 'Tasks' })).toBeInTheDocument();
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/');
    });
    expect(router.state.historyAction).toBe('REPLACE');
  });
});
