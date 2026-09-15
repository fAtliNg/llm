import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TaskForm } from '@/features/tasks/task-form';
import { renderWithProviders } from '@/test/render';

describe('T16 description placeholder', () => {
  it('shows the placeholder on the description field', () => {
    renderWithProviders(<TaskForm onSubmit={vi.fn()} />);
    const field = screen.getByPlaceholderText('What needs to be done?');
    expect(field).toBe(screen.getByLabelText('Description'));
  });
});
