import { Navigate, useParams } from 'react-router';

import { MetaPage } from '@/meta/meta-page';
import { metaNav } from '@/meta/nav';
import { findPage } from '@/meta/pages';
import { NotFoundPage } from '@/pages/not-found-page';

/**
 * The one route of the app. It looks the URL up in `meta/pages` and shows that page, or the 404 page
 * when there is none. The root URL opens the first page in the navigation.
 */
export function MetaRoute() {
  const { '*': splat = '' } = useParams();
  const page = findPage(splat);
  if (page) return <MetaPage page={page} />;
  const first = metaNav[0];
  if (splat === '' && first) return <Navigate to={first.to} replace />;
  return <NotFoundPage />;
}
