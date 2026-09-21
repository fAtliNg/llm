import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { metaPages } from '@/meta/pages';
import { pageUrl } from '@/meta/schema';
import { renderApp } from '@/test/render';

/** Every page under meta/pages opens at its URL with its heading and each field in place. */
describe('meta pages', () => {
  it.each(metaPages.map((page) => [page.id, page] as const))('%s opens from meta', (_, page) => {
    renderApp([`/${pageUrl(page.name)}`]);

    expect(screen.getByRole('heading', { name: page.name })).toBeInTheDocument();
    // A field placed in several layouts is in the DOM once per layout; CSS shows one of them.
    for (const id of Object.keys(page.fields)) {
      expect(screen.getAllByTestId(id).length).toBeGreaterThan(0);
    }
  });

  it('shows the 404 page for a URL that no meta page has', () => {
    renderApp(['/no-such-page']);

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it('opens the first page from the root URL', async () => {
    renderApp(['/']);

    const first = metaPages[0];
    if (!first) return;
    expect(await screen.findByRole('heading', { name: first.name })).toBeInTheDocument();
  });

  it('links every page from the main navigation', () => {
    renderApp(['/']);

    const nav = screen.getByRole('navigation', { name: 'Main' });
    for (const page of metaPages) {
      expect(nav).toContainElement(screen.getByRole('link', { name: page.name }));
    }
  });
});
