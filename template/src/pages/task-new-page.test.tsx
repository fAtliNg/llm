import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('TaskNewPage', () => {
  it('creates a task and navigates back to the list', async () => {
    const { user } = renderApp(['/tasks/new']);

    await user.type(await screen.findByLabelText('Title'), 'Review the pull request');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByRole('heading', { name: 'Tasks' })).toBeInTheDocument();
    expect(await screen.findByText('Review the pull request')).toBeInTheDocument();
  });
});
