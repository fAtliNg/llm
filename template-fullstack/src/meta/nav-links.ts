import { metaPages } from '@/meta/load';
import { pageUrl } from '@/meta/schema';

/** One link per page in `meta/pages`, in file order. The first page is where `/` goes. */
export const metaNav: { to: string; label: string }[] = metaPages.map((page) => ({
  to: `/${pageUrl(page.name)}`,
  label: page.name,
}));
