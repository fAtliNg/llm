import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('T34 app name from the environment', () => {
  it('is defined for tests and shown in the header', async () => {
    const name = import.meta.env.VITE_APP_NAME;
    expect(typeof name).toBe('string');
    expect(name?.length ?? 0).toBeGreaterThan(0);
    renderApp(['/']);
    const nav = await screen.findByRole('navigation', { name: 'Main' });
    expect(within(nav).getByText(name!)).toBeInTheDocument();
  });
});
