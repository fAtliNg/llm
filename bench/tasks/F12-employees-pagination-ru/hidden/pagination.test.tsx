import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

async function add(count: number, prefix = 'Aaa Bench') {
  for (let i = 1; i <= count; i += 1) {
    const response = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: `${prefix} ${String(i).padStart(3, '0')}`,
        email: `${prefix.replace(/\s/g, '-').toLowerCase()}-${String(i)}@bench.test`,
        department: 'sales',
        startDate: null,
      }),
    });
    expect(response.status).toBe(201);
  }
}

const dataRows = () => screen.getAllByRole('row').length - 1;

describe('F12 pagination in the web app', () => {
  it('shows one page for a short list with both buttons disabled', async () => {
    renderApp(['/employees']);
    expect(await screen.findByText('Page 1 of 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('walks forward and back through three pages of ten', async () => {
    await add(21);
    const { user } = renderApp(['/employees']);

    expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument();
    expect(dataRows()).toBe(10);
    expect(screen.getByRole('row', { name: /^Aaa Bench 001/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Page 2 of 3')).toBeInTheDocument();
    expect(await screen.findByRole('row', { name: /^Aaa Bench 011/ })).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /^Aaa Bench 001/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Page 3 of 3')).toBeInTheDocument();
    expect(await screen.findByRole('row', { name: /^Aaa Bench 021/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(await screen.findByText('Page 2 of 3')).toBeInTheDocument();
  });

  it('is fresh after creating an employee', async () => {
    await add(8);
    const { user } = renderApp(['/employees']);
    expect(await screen.findByText('Page 1 of 1')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'New employee' }));
    await user.type(await screen.findByLabelText('Name'), 'Aaa Bench 000');
    await user.type(screen.getByLabelText('Email'), 'aaa-bench-000@bench.test');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument();
    expect(await screen.findByRole('row', { name: /^Aaa Bench 000/ })).toBeInTheDocument();
  });
});
