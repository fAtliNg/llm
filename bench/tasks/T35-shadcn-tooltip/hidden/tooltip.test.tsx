import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('T35 tooltip on the delete button', () => {
  it('shows the tooltip text when the button is focused', async () => {
    renderApp(['/']);
    const button = await screen.findByRole('button', { name: 'Delete Add tests' });
    act(() => {
      button.focus();
    });
    expect((await screen.findAllByText('Delete this task')).length).toBeGreaterThan(0);
  });
});
