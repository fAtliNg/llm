import { NavLink } from 'react-router';

import { cn } from '@/lib/utils';
import { metaNav } from '@/meta/nav-links';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
    isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
  );

/** The built-in `nav` field: links to every page, in a row or in a column. */
export function MetaNav({
  id,
  orientation,
}: {
  id: string;
  orientation: 'horizontal' | 'vertical';
}) {
  return (
    <nav
      aria-label="Main"
      data-meta-id={id}
      className={cn(
        'flex gap-1',
        orientation === 'vertical' ? 'flex-col items-stretch' : 'flex-wrap items-center',
      )}
    >
      {metaNav.map((link) => (
        <NavLink key={link.to} to={link.to} className={linkClass}>
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
