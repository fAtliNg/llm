import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TaskForm } from '@/features/tasks/task-form';
import { renderWithProviders } from '@/test/render';

describe('T23 required description', () => {
  it('rejects a short description', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<TaskForm onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText('Title'), 'Valid title');
    await user.type(screen.getByLabelText('Description'), 'short');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Add at least 10 characters')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('accepts a long enough description', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<TaskForm onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText('Title'), 'Valid title');
    await user.type(screen.getByLabelText('Description'), 'Long enough description');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('is enforced by the mock API', async () => {
    const response = await fetch('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'X', description: 'short', status: 'todo', priority: 'low' }),
    });
    expect(response.status).toBe(400);
  });
});
