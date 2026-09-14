import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TaskStatusBadge } from '@/features/tasks/task-badges';

describe('T15 badge variants', () => {
  it('uses the swapped variants', () => {
    render(<TaskStatusBadge status="done" />);
    expect(screen.getByText('Done')).toHaveAttribute('data-variant', 'secondary');
  });

  it('keeps todo as outline and makes in_progress default', () => {
    render(<TaskStatusBadge status="in_progress" />);
    expect(screen.getByText('In progress')).toHaveAttribute('data-variant', 'default');
    render(<TaskStatusBadge status="todo" />);
    expect(screen.getByText('To do')).toHaveAttribute('data-variant', 'outline');
  });
});
