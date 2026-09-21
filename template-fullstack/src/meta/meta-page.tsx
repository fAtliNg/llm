import { type CSSProperties, createElement, type ReactNode } from 'react';

import {
  MetaIcon,
  MetaImage,
  MetaPager,
  MetaSearch,
  MetaTableView,
  MetaTheme,
} from '@/meta/builtins';
import { componentFor } from '@/meta/components';
import { useDevice } from '@/meta/device';
import { findPanel, findTable } from '@/meta/load';
import { MetaNav } from '@/meta/nav';
import {
  type ComponentField,
  gridFor,
  isContainerRef,
  isIcon,
  isImage,
  isNav,
  isSearch,
  isText,
  type MetaColumn,
  type MetaField,
  type MetaGrids,
  type MetaLayout,
  type MetaPage,
  type MetaPanel,
  type MetaRow,
  type TextField,
} from '@/meta/schema';

const TEXT_CLASS: Record<TextField['props']['variant'], string> = {
  title: 'text-[32px] leading-10 font-bold tracking-tight',
  heading: 'text-2xl leading-8 font-semibold tracking-tight',
  subheading: 'text-lg leading-7 font-semibold',
  body: 'text-base leading-7',
  muted: 'text-sm leading-6 text-muted-foreground',
  small: 'text-xs leading-5 font-semibold tracking-wide text-foreground',
  code: 'rounded-lg bg-muted px-5 py-4 font-mono text-sm leading-6 whitespace-pre overflow-x-auto',
  link: 'text-sm font-medium text-primary hover:underline',
};

function Text({ id, field }: { id: string; field: TextField }) {
  const { variant, children, href } = field.props;
  if (variant === 'link') {
    return (
      <a data-meta-id={id} href={href ?? '#'} className={TEXT_CLASS.link}>
        {children}
      </a>
    );
  }
  const Tag =
    variant === 'title'
      ? 'h1'
      : variant === 'heading'
        ? 'h2'
        : variant === 'subheading'
          ? 'h3'
          : variant === 'code'
            ? 'pre'
            : 'p';
  return (
    <Tag data-meta-id={id} className={TEXT_CLASS[variant]}>
      {children}
    </Tag>
  );
}

/** One field: a component from the library, a built-in, a panel, or a placeholder for what is not rendered yet. */
function Field({ id, field, slot }: { id: string; field: MetaField; slot: ReactNode }) {
  if (field.type === 'children') return <div data-meta-id={id}>{slot}</div>;
  if (isNav(field)) return <MetaNav id={id} {...field.props} />;
  if (isText(field)) return <Text id={id} field={field} />;
  if (isIcon(field)) return <MetaIcon id={id} props={field.props} />;
  if (isImage(field)) return <MetaImage id={id} props={field.props} />;
  if (isSearch(field)) return <MetaSearch id={id} props={field.props} />;
  if (field.type === 'theme') return <MetaTheme id={id} />;
  if (field.type === 'pager') return <MetaPager id={id} />;
  if (field.type === 'panel') {
    const panel = findPanel(id);
    return panel ? <MetaPanelView panel={panel} slot={slot} /> : null;
  }
  if (field.type === 'table') {
    const table = findTable(id);
    return table ? <MetaTableView table={table} /> : null;
  }
  if (isContainerRef(field)) {
    // Rendered by a later step; until then the page shows where it goes.
    return (
      <section
        data-meta-id={id}
        aria-label={`${field.type} ${id}`}
        className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground"
      >
        {field.type} &quot;{id}&quot; is not rendered yet
      </section>
    );
  }
  return createElement(componentFor(field.type), {
    'data-meta-id': id,
    ...(field as ComponentField).props,
  });
}

const JUSTIFY = { left: 'start', center: 'center', right: 'end' } as const;
const ALIGN = { top: 'start', middle: 'center', bottom: 'end' } as const;

/** Inline styles for a row (grid) or a column (grid item): alignment falls through from row to column. */
function boxStyle(box: MetaRow | MetaColumn, isRow: boolean): CSSProperties {
  const style: CSSProperties = {};
  if (box.align) style[isRow ? 'justifyItems' : 'justifySelf'] = JUSTIFY[box.align];
  if (box.valign) style[isRow ? 'alignItems' : 'alignSelf'] = ALIGN[box.valign];
  if (box.margin !== undefined) style.margin = box.margin;
  if (box.padding !== undefined) style.padding = box.padding;
  if (box.background !== undefined) style.background = box.background;
  if (box.border) {
    if (box.border.top) style.borderTop = box.border.top;
    if (box.border.right) style.borderRight = box.border.right;
    if (box.border.bottom) style.borderBottom = box.border.bottom;
    if (box.border.left) style.borderLeft = box.border.left;
  }
  if (box.height !== undefined) style.height = box.height;
  if (box.maxWidth !== undefined) style.maxWidth = box.maxWidth;
  if (box.sticky) {
    style.position = 'sticky';
    style.top = box.top ?? 0;
    style.zIndex = 10;
    // A sticky grid item must not stretch to the row height, or it has nowhere to stick.
    if (!isRow && !box.valign) style.alignSelf = 'start';
  }
  if (box.scroll) style.overflowY = 'auto';
  return style;
}

/** The rows of the grid for the current screen size; `slot` is what a `children` field shows. */
function Grid({
  fields,
  grids,
  slot,
}: {
  fields: Record<string, MetaField>;
  grids: MetaGrids;
  slot?: ReactNode;
}) {
  const grid = gridFor(grids, useDevice());
  return (
    <div className="flex flex-col">
      {grid.rows.map((row, index) => (
        <div
          key={index}
          data-meta-row={index}
          className="grid"
          style={{
            gridTemplateColumns: row.columns.map((c) => c.width ?? 'minmax(0, 1fr)').join(' '),
            gap: row.gap ?? 16,
            ...boxStyle(row, true),
          }}
        >
          {row.columns.map((column) => {
            // The schema already guarantees every placed id is in fields.
            const field = fields[column.field];
            return field ? (
              <div
                key={column.field}
                data-meta-column={column.field}
                style={boxStyle(column, false)}
              >
                <Field id={column.field} field={field} slot={slot} />
              </div>
            ) : null;
          })}
        </div>
      ))}
    </div>
  );
}

/** A page straight from its meta: the heading (unless the page draws its own), then its grid. */
export function MetaPageView({ page }: { page: MetaPage }) {
  return (
    <section data-meta-page={page.id} style={{ background: page.background }}>
      {page.heading && <h1 className="mb-4 text-2xl font-semibold">{page.name}</h1>}
      <Grid fields={page.fields} grids={page.grid} />
    </section>
  );
}

/** A panel placed in a column: its own fields and grid; `slot` passes through to a nested `children`. */
export function MetaPanelView({ panel, slot }: { panel: MetaPanel; slot?: ReactNode }) {
  return (
    <div data-meta-id={panel.id} style={{ background: panel.background }}>
      <Grid fields={panel.fields} grids={panel.grid} slot={slot} />
    </div>
  );
}

/** A layout around whatever it is given: its grid, with the `children` field showing `children`. */
export function MetaLayoutView({ layout, children }: { layout: MetaLayout; children: ReactNode }) {
  return (
    <div data-meta-id={`layout:${layout.id}`} style={{ background: layout.background }}>
      <Grid fields={layout.fields} grids={layout.grid} slot={children} />
    </div>
  );
}
