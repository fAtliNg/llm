import { icons, type LucideIcon } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Link, NavLink, useLocation } from 'react-router';

import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { metaPages, metaPanels } from '@/meta/load';
import { metaNav } from '@/meta/nav-links';
import {
  type IconField,
  type ImageField,
  type MetaTable,
  pageUrl,
  type SearchField,
} from '@/meta/schema';

/* icon ------------------------------------------------------------------------------------------- */

function pascal(kebab: string): string {
  return kebab.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase());
}

/** A lucide icon by name; with `href` it is a link (external ones open in a new tab). */
export function MetaIcon({ id, props }: { id: string; props: IconField['props'] }) {
  const Icon = (icons as Record<string, LucideIcon>)[pascal(props.name)];
  if (!Icon) {
    return (
      <span data-meta-id={id} className="text-xs text-destructive">
        no icon &quot;{props.name}&quot;
      </span>
    );
  }
  const svg = <Icon size={props.size} aria-hidden={props.label ? undefined : true} />;
  if (props.href === undefined) {
    return (
      <span
        data-meta-id={id}
        aria-label={props.label}
        className="inline-flex text-muted-foreground"
      >
        {svg}
      </span>
    );
  }
  const external = /^https?:/.test(props.href);
  const className = 'inline-flex text-muted-foreground transition-colors hover:text-foreground';
  return external ? (
    <a
      data-meta-id={id}
      href={props.href}
      aria-label={props.label}
      className={className}
      target="_blank"
      rel="noreferrer"
    >
      {svg}
    </a>
  ) : (
    <Link data-meta-id={id} to={props.href} aria-label={props.label} className={className}>
      {svg}
    </Link>
  );
}

/* image ------------------------------------------------------------------------------------------ */

export function MetaImage({ id, props }: { id: string; props: ImageField['props'] }) {
  return (
    <img
      data-meta-id={id}
      src={props.src}
      alt={props.alt}
      width={props.width}
      height={props.height}
    />
  );
}

/* theme ------------------------------------------------------------------------------------------ */

const THEME_KEY = 'theme';
const listeners = new Set<() => void>();

function readTheme(): 'light' | 'dark' {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // Storage may be unavailable; fall through to the system preference.
  }
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function applyTheme(theme: 'light' | 'dark'): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

/** Light/dark switch. The class `dark` on <html> drives every colour; the choice survives reloads. */
export function MetaTheme({ id }: { id: string }) {
  const theme = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    readTheme,
    () => 'light' as const,
  );
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  const Icon = theme === 'dark' ? icons.Sun : icons.Moon;
  return (
    <button
      type="button"
      data-meta-id={id}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
      onClick={() => {
        const next = theme === 'dark' ? 'light' : 'dark';
        try {
          localStorage.setItem(THEME_KEY, next);
        } catch {
          // Without storage the choice lasts for this page only.
        }
        applyTheme(next);
        for (const cb of listeners) cb();
      }}
    >
      <Icon size={18} aria-hidden />
    </button>
  );
}

/* search ----------------------------------------------------------------------------------------- */

interface Entry {
  to: string;
  name: string;
  text: string;
}

/** Everything searchable: page names plus the text fields of the page and of the panels it places. */
function buildIndex(): Entry[] {
  return metaPages.map((page) => {
    const parts: string[] = [];
    const collect = (fields: Record<string, { type: string; props?: unknown }>) => {
      for (const [id, field] of Object.entries(fields)) {
        if (field.type === 'text') parts.push((field.props as { children: string }).children);
        if (field.type === 'panel') {
          const panel = metaPanels.find((p) => p.id === id);
          if (panel) collect(panel.fields);
        }
      }
    };
    collect(page.fields);
    return { to: `/${pageUrl(page.name)}`, name: page.name, text: parts.join(' ').toLowerCase() };
  });
}

let index: Entry[] | undefined;

/** A search box over the pages: matches names and text, lists the hits as links. */
export function MetaSearch({ id, props }: { id: string; props: SearchField['props'] }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  index ??= buildIndex();
  const hits =
    q === ''
      ? []
      : index.filter((e) => e.name.toLowerCase().includes(q) || e.text.includes(q)).slice(0, 8);
  return (
    <div data-meta-id={id} className="relative">
      <Input
        type="search"
        placeholder={props.placeholder}
        aria-label={props.placeholder}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
        }}
      />
      {hits.length > 0 && (
        <ul className="absolute top-full left-0 z-20 mt-1 w-72 rounded-lg border bg-popover p-1 shadow-md">
          {hits.map((hit) => (
            <li key={hit.to}>
              <Link
                to={hit.to}
                className="block rounded-md px-3 py-1.5 text-sm hover:bg-muted"
                onClick={() => {
                  setQuery('');
                }}
              >
                {hit.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* pager ------------------------------------------------------------------------------------------ */

/** Previous and next page, in navigation order, like the footer of a documentation page. */
export function MetaPager({ id }: { id: string }) {
  const { pathname } = useLocation();
  const at = metaNav.findIndex((l) => l.to === pathname.replace(/\/+$/, ''));
  const prev = at > 0 ? metaNav[at - 1] : undefined;
  const next = at >= 0 ? metaNav[at + 1] : undefined;
  const box = 'block rounded-lg border px-4 py-3 transition-colors hover:border-primary';
  return (
    <nav data-meta-id={id} aria-label="Pager" className="grid grid-cols-2 gap-4 border-t pt-6">
      <div>
        {prev && (
          <NavLink to={prev.to} className={box}>
            <span className="block text-xs text-muted-foreground">Previous page</span>
            <span className="block text-sm font-medium text-primary">{prev.label}</span>
          </NavLink>
        )}
      </div>
      <div className="text-right">
        {next && (
          <NavLink to={next.to} className={box}>
            <span className="block text-xs text-muted-foreground">Next page</span>
            <span className="block text-sm font-medium text-primary">{next.label}</span>
          </NavLink>
        )}
      </div>
    </nav>
  );
}

/* table ------------------------------------------------------------------------------------------ */

const CELL_ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' } as const;

/** A table from `meta/tables`: its columns and, for now, the rows written in the file. */
export function MetaTableView({ table }: { table: MetaTable }) {
  return (
    <div data-meta-id={table.id} className="overflow-x-auto rounded-lg border">
      <Table>
        {table.caption && (
          <caption className="p-2 text-sm text-muted-foreground">{table.caption}</caption>
        )}
        <TableHeader>
          <TableRow>
            {table.columns.map((column) => (
              <TableHead
                key={column.key}
                style={{ width: column.width }}
                className={cn(column.align && CELL_ALIGN[column.align])}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.rows.map((row, i) => (
            <TableRow key={i}>
              {table.columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={cn(
                    'align-top whitespace-normal',
                    column.align && CELL_ALIGN[column.align],
                  )}
                >
                  {String(row[column.key] ?? '')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
