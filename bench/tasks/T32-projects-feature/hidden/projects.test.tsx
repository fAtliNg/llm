import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('T32 projects', () => {
  it('has a projects page linked from the navigation', async () => {
    renderApp(['/projects']);
    expect(await screen.findByRole('heading', { name: 'Projects' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Projects' })).toHaveAttribute(
      'href',
      '/projects',
    );
  });

  it('requires a name', async () => {
    const { user } = renderApp(['/projects/new']);
    await user.click(await screen.findByRole('button', { name: 'Create' }));
    expect(await screen.findByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
  });

  it('creates a project with a deadline and shows it in the list', async () => {
    const name = 'Quorvian Launch Sequence';
    const { user } = renderApp(['/projects/new']);
    await user.type(await screen.findByLabelText('Name'), name);
    fireEvent.change(screen.getByLabelText('Deadline'), { target: { value: '2027-01-15' } });
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByRole('heading', { name: 'Projects' })).toBeInTheDocument();
    const row = (await screen.findByText(name)).closest('tr')!;
    expect(within(row).getByText('2027-01-15')).toBeInTheDocument();
  });
});
