import { Navigate, useParams } from 'react-router';

import { findPage, layoutChain } from '@/meta/load';
import { MetaLayoutView, MetaPageView } from '@/meta/meta-page';
import { metaNav } from '@/meta/nav-links';
import { NotFoundPage } from '@/pages/not-found-page';

/**
 * The one route of the app. It looks the URL up in `meta/pages`, wraps the page in its layouts
 * (innermost first) and shows it, or the 404 page when there is none. The root URL opens the first
 * page in the navigation.
 */
export function MetaRoute() {
  const { '*': splat = '' } = useParams();
  const page = findPage(splat);
  if (!page) {
    const first = metaNav[0];
    if (splat === '' && first) return <Navigate to={first.to} replace />;
    return <NotFoundPage />;
  }
  return layoutChain(page).reduce<React.ReactNode>(
    (inner, layout) => (
      <MetaLayoutView key={layout.id} layout={layout}>
        {inner}
      </MetaLayoutView>
    ),
    <MetaPageView page={page} />,
  );
}
