import type { RouteObject } from 'react-router';

import { MetaPage } from '@/meta/meta-page';
import { metaPages } from '@/meta/pages';
import { pageUrl } from '@/meta/schema';

/** One route per page in `meta/pages`, mounted under the root layout by `src/app/router.tsx`. */
export const metaRoutes: RouteObject[] = metaPages.map((page) => ({
  path: pageUrl(page.name),
  element: <MetaPage page={page} />,
}));

/** One link per page, rendered by `src/app/root-layout.tsx` after the hand-written links. */
export const metaNav: { to: string; label: string }[] = metaPages.map((page) => ({
  to: `/${pageUrl(page.name)}`,
  label: page.name,
}));
