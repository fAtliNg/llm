import { metaPages } from '@/meta/load';
import { pageUrl } from '@/meta/schema';

export interface NavLinkItem {
  to: string;
  label: string;
  section?: string;
}

/** One link per page in `meta/pages`, in file order. The first page is where `/` goes. */
export const metaNav: NavLinkItem[] = metaPages.map((page) => ({
  to: `/${pageUrl(page.name)}`,
  label: page.name,
  section: page.section,
}));
