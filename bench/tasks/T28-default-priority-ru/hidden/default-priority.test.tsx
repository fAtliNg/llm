import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TaskForm } from '@/features/tasks/task-form';
import { renderWithProviders } from '@/test/render';

describe('T28 default priority', () => {
  it('preselects High and submits it', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<TaskForm onSubmit={onSubmit} />);
    expect(screen.getByRole('combobox', { name: 'Priority' })).toHaveTextContent('High');
    await user.type(screen.getByLabelText('Title'), 'Defaults');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ priority: 'high' });
  });
});
