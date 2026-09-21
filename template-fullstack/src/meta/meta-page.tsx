import { type CSSProperties, createElement, type ReactNode } from 'react';

import { componentFor } from '@/meta/components';
import { useDevice } from '@/meta/device';
import { MetaNav } from '@/meta/nav';
import {
  type ComponentField,
  gridFor,
  isContainerRef,
  isNav,
  isText,
  type MetaColumn,
  type MetaField,
  type MetaGrids,
  type MetaLayout,
  type MetaPage,
  type MetaRow,
} from '@/meta/schema';

const TEXT_CLASS = {
  title: 'text-2xl font-semibold',
  heading: 'text-lg font-semibold',
  body: 'text-sm leading-6',
  muted: 'text-sm text-muted-foreground',
} as const;

/** One field: a component from the library, a built-in, or a placeholder for what is not rendered yet. */
function Field({ id, field, slot }: { id: string; field: MetaField; slot: ReactNode }) {
  if (field.type === 'children') return <div data-meta-id={id}>{slot}</div>;
  if (isNav(field)) return <MetaNav id={id} orientation={field.props.orientation} />;
  if (isText(field)) {
    const Tag =
      field.props.variant === 'title' ? 'h1' : field.props.variant === 'heading' ? 'h2' : 'p';
    return (
      <Tag data-meta-id={id} className={TEXT_CLASS[field.props.variant]}>
        {field.props.children}
      </Tag>
    );
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
    <div className="space-y-4">
      {grid.rows.map((row, index) => (
        <div
          key={index}
          data-meta-row={index}
          className="grid gap-4"
          style={{
            gridTemplateColumns: row.columns.map((c) => c.width ?? 'minmax(0, 1fr)').join(' '),
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

/** A page straight from its meta: the heading, then its grid. */
export function MetaPageView({ page }: { page: MetaPage }) {
  return (
    <section data-meta-page={page.id} className="space-y-4" style={{ background: page.background }}>
      <h1 className="text-2xl font-semibold">{page.name}</h1>
      <Grid fields={page.fields} grids={page.grid} />
    </section>
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
