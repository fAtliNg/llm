import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('Projects', () => {
  it('lists the projects from the API', async () => {
    renderApp(['/projects']);

    const row = await screen.findByRole('row', { name: /^Website/ });
    expect(within(row).getByText('Public site and docs')).toBeInTheDocument();
  });

  it('creates a project and returns to the list', async () => {
    const { user } = renderApp(['/projects/new']);

    await user.type(await screen.findByLabelText('Name'), 'Sample value');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByRole('heading', { name: 'Projects' })).toBeInTheDocument();
    expect(await screen.findByRole('row', { name: /^Sample value/ })).toBeInTheDocument();
  });
});
