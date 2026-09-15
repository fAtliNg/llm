import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('T22 edit heading', () => {
  it('includes the task title', async () => {
    renderApp(['/tasks/2/edit']);
    expect(
      await screen.findByRole('heading', { name: 'Edit: Write the task form' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('Write the task form');
  });
});
