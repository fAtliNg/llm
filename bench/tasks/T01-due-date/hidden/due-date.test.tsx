import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TaskForm } from '@/features/tasks/task-form';
import { renderApp, renderWithProviders } from '@/test/render';

describe('T01 due date', () => {
  it('submits the due date when set', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<TaskForm onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText('Title'), 'With a deadline');
    fireEvent.change(screen.getByLabelText('Due date'), { target: { value: '2026-10-01' } });
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      title: 'With a deadline',
      dueDate: '2026-10-01',
    });
  });

  it('treats the due date as optional', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<TaskForm onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText('Title'), 'No deadline');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledOnce();
    const values = onSubmit.mock.calls[0]?.[0] as { title: string; dueDate?: string };
    expect(values.title).toBe('No deadline');
    expect(values.dueDate ?? '').toBe('');
  });

  it('shows a Due date column in the table', async () => {
    renderApp(['/']);
    expect(await screen.findByRole('columnheader', { name: 'Due date' })).toBeInTheDocument();
    expect(await screen.findByText('Set up the project')).toBeInTheDocument();
  });
});
