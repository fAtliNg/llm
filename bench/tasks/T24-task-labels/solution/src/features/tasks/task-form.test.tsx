import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TaskForm } from '@/features/tasks/task-form';
import { renderWithProviders } from '@/test/render';

describe('TaskForm', () => {
  it('shows a validation error and does not submit when the title is empty', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<TaskForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the values including a status picked from the select', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<TaskForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Title'), 'Ship the template');
    await user.type(screen.getByLabelText('Description'), 'With tests');
    await user.click(screen.getByRole('combobox', { name: 'Status' }));
    await user.click(await screen.findByRole('option', { name: 'Done' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      title: 'Ship the template',
      description: 'With tests',
      status: 'done',
      priority: 'medium',
      labels: [],
    });
  });
});
