import { icons, type LucideIcon } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import { Link, NavLink, useLocation } from 'react-router';

import { applyTheme, defaultTheme, storeTheme } from '@/meta/theme';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { metaPages, metaPanels, metaThemes } from '@/meta/load';
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

/** Brand marks lucide no longer ships; same outline style, 24-unit viewBox. */
const BRAND: Record<string, string> = {
  github:
    'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4M9 18c-4.51 2-5-2-7-2',
};

/** A lucide icon by name; with `href` it is a link (external ones open in a new tab). */
export function MetaIcon({ id, props }: { id: string; props: IconField['props'] }) {
  const brand = BRAND[props.name];
  const Icon: LucideIcon | undefined = brand
    ? (((p: { size?: number; 'aria-hidden'?: boolean }) => (
        <svg
          width={p.size}
          height={p.size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden={p['aria-hidden']}
        >
          <path d={brand} />
        </svg>
      )) as unknown as LucideIcon)
    : (icons as Record<string, LucideIcon>)[pascal(props.name)];
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

const listeners = new Set<() => void>();

function currentThemeId(): string {
  return document.documentElement.dataset.theme ?? defaultTheme().id;
}

/** Switches between the themes in `meta/themes`: the first light one and the first dark one. */
export function MetaTheme({ id }: { id: string }) {
  const current = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    currentThemeId,
    () => metaThemes[0]?.id ?? 'light',
  );
  const active = metaThemes.find((t) => t.id === current);
  const isDark = active?.dark ?? false;
  const other = metaThemes.find((t) => t.dark !== isDark);
  const Icon = isDark ? icons.Moon : icons.Sun;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      data-meta-id={id}
      aria-label={other ? `Switch to ${other.id} theme` : 'Theme'}
      disabled={!other}
      className="relative inline-flex h-[22px] w-10 shrink-0 items-center rounded-full border border-input bg-muted transition-colors"
      onClick={() => {
        if (!other) return;
        applyTheme(other);
        storeTheme(other);
        for (const cb of listeners) cb();
      }}
    >
      <span
        className={cn(
          'absolute top-px left-px flex size-[18px] items-center justify-center rounded-full bg-background text-foreground shadow transition-transform',
          isDark && 'translate-x-[18px]',
        )}
      >
        <Icon size={12} aria-hidden />
      </span>
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
      <div className="flex h-10 items-center gap-2 rounded-lg bg-muted px-3 text-sm text-muted-foreground focus-within:ring-2 focus-within:ring-ring/50">
        <icons.Search size={16} aria-hidden />
        <input
          type="search"
          placeholder={props.placeholder}
          aria-label={props.placeholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          className="w-full min-w-0 bg-transparent outline-none placeholder:text-muted-foreground"
        />
        <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-sans text-xs">
          ⌘K
        </kbd>
      </div>
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
    <nav data-meta-id={id} aria-label="Pager" className="grid grid-cols-2 gap-4">
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
