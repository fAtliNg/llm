import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { layoutChain, metaPages } from '@/meta/load';
import { pageUrl } from '@/meta/schema';
import { renderApp } from '@/test/render';

/** Every page under meta/pages opens at its URL, inside its layouts, with its heading and each field in place. */
describe('meta pages', () => {
  it.each(metaPages.map((page) => [page.id, page] as const))('%s opens from meta', (_, page) => {
    renderApp([`/${pageUrl(page.name)}`]);

    expect(screen.getByRole('heading', { name: page.name })).toBeInTheDocument();
    for (const id of Object.keys(page.fields)) {
      expect(screen.getAllByTestId(id).length).toBeGreaterThan(0);
    }
    for (const layout of layoutChain(page)) {
      expect(screen.getByTestId(`layout:${layout.id}`)).toBeInTheDocument();
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

  it('links every page from a nav field', () => {
    const withNav = metaPages.find((page) =>
      layoutChain(page).some((layout) =>
        Object.values(layout.fields).some((f) => f.type === 'nav'),
      ),
    );
    if (!withNav) return;
    renderApp([`/${pageUrl(withNav.name)}`]);

    // Every page is linked from some nav on the screen: the main one or its section's.
    for (const page of metaPages) {
      const nav = screen.getAllByRole('navigation', { name: page.section ?? 'Main' })[0];
      if (!nav) throw new Error(`no navigation for ${page.section ?? 'Main'}`);
      expect(within(nav).getByRole('link', { name: page.name })).toBeInTheDocument();
    }
  });
});
