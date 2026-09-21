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
    for (const field of page.fields) expect(screen.getByTestId(field.id)).toBeInTheDocument();
  });

  it('links every page from the main navigation', () => {
    renderApp(['/']);

    const nav = screen.getByRole('navigation', { name: 'Main' });
    for (const page of metaPages) {
      expect(nav).toContainElement(screen.getByRole('link', { name: page.name }));
    }
  });
});
