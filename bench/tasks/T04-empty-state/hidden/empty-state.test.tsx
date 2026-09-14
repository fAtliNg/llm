import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EmptyState } from '@/components/empty-state';
import { TaskList } from '@/features/tasks/task-list';
import { renderWithProviders } from '@/test/render';

describe('T04 EmptyState', () => {
  it('renders title, description and action', () => {
    render(
      <EmptyState title="Nothing here" description="Try later" action={<button>Retry</button>} />,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Nothing here' })).toBeInTheDocument();
    expect(screen.getByText('Try later')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('is used by TaskList when there are no tasks', () => {
    renderWithProviders(<TaskList tasks={[]} />);
    expect(screen.getByRole('heading', { level: 2, name: 'No tasks yet' })).toBeInTheDocument();
    expect(screen.getByText('Create the first one.')).toBeInTheDocument();
  });
});
