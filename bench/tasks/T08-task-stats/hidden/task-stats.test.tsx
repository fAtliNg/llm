import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('T08 task stats', () => {
  it('shows the stats line computed by the API', async () => {
    renderApp(['/']);
    expect(await screen.findByText('1 of 3 done')).toBeInTheDocument();
    expect(await screen.findByText('Set up the project')).toBeInTheDocument();
  });

  it('still serves single tasks by id', async () => {
    renderApp(['/tasks/2/edit']);
    expect(await screen.findByRole('heading', { name: 'Edit task' })).toBeInTheDocument();
    expect(await screen.findByLabelText('Title')).toHaveValue('Write the task form');
  });
});
