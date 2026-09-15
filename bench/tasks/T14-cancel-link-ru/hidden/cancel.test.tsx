import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('T14 cancel link', () => {
  it('returns to the list without creating a task', async () => {
    const { user } = renderApp(['/tasks/new']);
    await user.type(await screen.findByLabelText('Title'), 'Should not be saved');
    await user.click(screen.getByRole('link', { name: 'Cancel' }));
    expect(await screen.findByRole('heading', { name: 'Tasks' })).toBeInTheDocument();
    await screen.findByText('Set up the project');
    expect(screen.getAllByRole('row')).toHaveLength(4);
    expect(screen.queryByText('Should not be saved')).not.toBeInTheDocument();
  });
});
