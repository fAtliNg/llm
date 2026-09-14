import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('T06 task details', () => {
  it('shows the task with badges and an edit link', async () => {
    renderApp(['/tasks/2']);
    expect(await screen.findByRole('heading', { name: 'Write the task form' })).toBeInTheDocument();
    expect(screen.getByText('Validation with zod, fields from shadcn')).toBeInTheDocument();
    expect(screen.getByText('In progress')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/tasks/2/edit');
  });

  it('links titles in the list to the details page', async () => {
    renderApp(['/']);
    expect(await screen.findByRole('link', { name: 'Write the task form' })).toHaveAttribute(
      'href',
      '/tasks/2',
    );
  });

  it('reports unknown tasks', async () => {
    renderApp(['/tasks/999']);
    expect(await screen.findByText('Task not found')).toBeInTheDocument();
  });
});
