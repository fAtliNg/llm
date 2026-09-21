import { metaPages } from '@/meta/pages';
import { pageUrl } from '@/meta/schema';

/** One link per page in `meta/pages`, rendered by `src/app/root-layout.tsx` after the hand-written links. */
export const metaNav: { to: string; label: string }[] = metaPages.map((page) => ({
  to: `/${pageUrl(page.name)}`,
  label: page.name,
}));
