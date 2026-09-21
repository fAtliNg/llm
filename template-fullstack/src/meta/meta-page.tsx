import { type CSSProperties, createElement } from 'react';

import { componentFor } from '@/meta/components';
import {
  type Device,
  DEVICES,
  isContainerRef,
  layoutFor,
  type MetaField,
  type MetaColumn,
  type MetaLayout,
  type MetaPage,
  type MetaRow,
} from '@/meta/schema';

function Field({ id, field }: { id: string; field: MetaField }) {
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
  return createElement(componentFor(field.type), { 'data-meta-id': id, ...field.props });
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
  return style;
}

function Grid({ page, layout }: { page: MetaPage; layout: MetaLayout }) {
  return (
    <div className="space-y-4">
      {layout.rows.map((row, index) => (
        <div
          key={index}
          data-meta-row={index}
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${String(row.columns.length)}, minmax(0, 1fr))`,
            ...boxStyle(row, true),
          }}
        >
          {row.columns.map((column) => {
            // The schema already guarantees every placed id is in fields.
            const field = page.fields[column.field];
            return field ? (
              <div
                key={column.field}
                data-meta-column={column.field}
                style={boxStyle(column, false)}
              >
                <Field id={column.field} field={field} />
              </div>
            ) : null;
          })}
        </div>
      ))}
    </div>
  );
}

// Tailwind only ships classes it can see, so every combination of screens a grid may serve is spelled
// out. Breakpoints: mobile below md (768px), tablet from md to below lg (1024px), desktop from lg.
const VISIBLE: Record<string, string> = {
  'desktop,tablet,mobile': '',
  'desktop,tablet': 'hidden md:block',
  'tablet,mobile': 'lg:hidden',
  desktop: 'hidden lg:block',
  tablet: 'hidden md:block lg:hidden',
  mobile: 'md:hidden',
};

/**
 * Renders a page straight from its meta: the heading, then the grid for the current screen size.
 * Every distinct layout is in the DOM once and CSS shows the one that applies, so resizing the window
 * switches layouts without a re-render.
 */
export function MetaPage({ page }: { page: MetaPage }) {
  const groups = new Map<MetaLayout, Device[]>();
  for (const device of DEVICES) {
    const layout = layoutFor(page, device);
    groups.set(layout, [...(groups.get(layout) ?? []), device]);
  }
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{page.name}</h1>
      {[...groups.entries()].map(([layout, devices]) => (
        <div
          key={devices.join(',')}
          data-meta-layout={devices.join(',')}
          className={VISIBLE[devices.join(',')]}
        >
          <Grid page={page} layout={layout} />
        </div>
      ))}
    </section>
  );
}
