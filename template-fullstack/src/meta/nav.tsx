import { NavLink } from 'react-router';

import { cn } from '@/lib/utils';
import { metaNav } from '@/meta/nav-links';

const STYLES = {
  pills: ({ isActive }: { isActive: boolean }) =>
    cn(
      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
      isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
    ),
  plain: ({ isActive }: { isActive: boolean }) =>
    cn(
      'py-1 text-sm font-medium transition-colors',
      isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
    ),
};

/** The built-in `nav` field: links to pages, in a row or in a column, all of them or one section. */
export function MetaNav({
  id,
  orientation,
  variant,
  section,
  sections,
}: {
  id: string;
  orientation: 'horizontal' | 'vertical';
  variant: 'pills' | 'plain';
  section?: string;
  sections: boolean;
}) {
  let links = section === undefined ? metaNav : metaNav.filter((l) => l.section === section);
  if (sections) {
    const seen = new Set<string>();
    links = metaNav
      .filter((l) => l.section !== undefined && !seen.has(l.section) && seen.add(l.section))
      .map((l) => ({ to: l.to, label: l.section ?? l.label }));
  }
  return (
    <nav
      aria-label={sections ? 'Sections' : (section ?? 'Main')}
      data-meta-id={id}
      className={cn(
        'flex',
        orientation === 'vertical'
          ? 'flex-col items-stretch gap-0.5'
          : 'flex-wrap items-center gap-1',
        variant === 'plain' && orientation === 'horizontal' && 'gap-6',
      )}
    >
      {links.map((link) => (
        <NavLink key={link.to} to={link.to} className={STYLES[variant]}>
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
