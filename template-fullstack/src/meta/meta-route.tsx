import { useParams } from 'react-router';

import { MetaPage } from '@/meta/meta-page';
import { findPage } from '@/meta/pages';
import { NotFoundPage } from '@/pages/not-found-page';

/**
 * The one route for everything described in meta. It takes whatever URL the hand-written routes did
 * not, looks the page up in `meta/pages` by that URL and shows it, or the 404 page when there is none.
 */
export function MetaRoute() {
  const { '*': splat = '' } = useParams();
  const page = findPage(splat);
  return page ? <MetaPage page={page} /> : <NotFoundPage />;
}
