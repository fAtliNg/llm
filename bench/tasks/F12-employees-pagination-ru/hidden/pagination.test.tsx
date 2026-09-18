import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

/** The pager text may be split across elements: match on the whole text of a small element. */
const pageText = (text: string) => (_content: string, node: Element | null) =>
  node?.textContent?.replace(/\s+/g, ' ').trim() === text && node.children.length <= 3;

const findPage = async (page: number, pages: number) =>
  (await screen.findAllByText(pageText(`Page ${String(page)} of ${String(pages)}`)))[0];

/** Names starting with a digit sort before any seeded name, whatever the seeds are. */
async function add(count: number, prefix = '0 Bench') {
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

const total = async () =>
  ((await (await fetch('/api/employees?pageSize=1')).json()) as { total: number }).total;

const dataRows = () => screen.getAllByRole('row').length - 1;

describe('F12 pagination in the web app', () => {
  it('walks forward and back through three pages of ten', async () => {
    // At least 21 employees: three pages or more, whatever the seeds.
    await add(21);
    const count = await total();
    const pages = Math.ceil(count / 10);
    const { user } = renderApp(['/employees']);

    expect(await findPage(1, pages)).toBeInTheDocument();
    expect(dataRows()).toBe(10);
    expect(screen.getByRole('row', { name: /^0 Bench 001/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await findPage(2, pages)).toBeInTheDocument();
    // The pager text changes before the new rows arrive: wait for a row of the second page.
    expect(await screen.findByRole('row', { name: /^0 Bench 011/ })).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /^0 Bench 001/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();

    for (let page = 3; page <= pages; page += 1) {
      await user.click(screen.getByRole('button', { name: 'Next' }));
      expect(await findPage(page, pages)).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    await waitFor(() => {
      expect(dataRows()).toBe(count - (pages - 1) * 10);
    });

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(await findPage(pages - 1, pages)).toBeInTheDocument();
  });

  it('is fresh after creating an employee', async () => {
    // Fill up to a multiple of ten, so that one more employee adds a page.
    const before = await total();
    if (before % 10 !== 0) await add(10 - (before % 10));
    const count = await total();
    const pages = count / 10;
    const { user } = renderApp(['/employees']);
    expect(await findPage(1, pages)).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'New employee' }));
    await user.type(await screen.findByLabelText('Name'), '0 Bench 000');
    await user.type(screen.getByLabelText('Email'), '0-bench-000@bench.test');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await findPage(1, pages + 1)).toBeInTheDocument();
    expect(await screen.findByRole('row', { name: /^0 Bench 000/ })).toBeInTheDocument();
  });
});
