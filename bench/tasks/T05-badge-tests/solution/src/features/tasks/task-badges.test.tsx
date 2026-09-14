import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUSES,
} from '@/features/tasks/model';
import { TaskPriorityBadge, TaskStatusBadge } from '@/features/tasks/task-badges';

describe('TaskStatusBadge', () => {
  it.each(TASK_STATUSES)('renders the label for %s', (status) => {
    render(<TaskStatusBadge status={status} />);
    expect(screen.getByText(TASK_STATUS_LABELS[status])).toBeInTheDocument();
  });
});

describe('TaskPriorityBadge', () => {
  it.each(TASK_PRIORITIES)('renders the label for %s', (priority) => {
    render(<TaskPriorityBadge priority={priority} />);
    expect(screen.getByText(TASK_PRIORITY_LABELS[priority])).toBeInTheDocument();
  });
});
