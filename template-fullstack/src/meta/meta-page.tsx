import { createElement } from 'react';

import { componentFor } from '@/meta/components';
import { isContainerRef, type MetaField, type MetaPage } from '@/meta/schema';

function Field({ field }: { field: MetaField }) {
  if (isContainerRef(field)) {
    // Rendered by a later step; until then the page shows where it goes.
    return (
      <section
        data-meta-id={field.id}
        aria-label={`${field.type} ${field.id}`}
        className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground"
      >
        {field.type} &quot;{field.id}&quot; is not rendered yet
      </section>
    );
  }
  return createElement(componentFor(field.type), { 'data-meta-id': field.id, ...field.props });
}

/** Renders a page straight from its meta: the heading, then the grid, row by row, column by column. */
export function MetaPage({ page }: { page: MetaPage }) {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{page.name}</h1>
      {page.rows.map((row, index) => (
        <div
          key={index}
          data-meta-row={index}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${String(row.columns.length)}, minmax(0, 1fr))` }}
        >
          {row.columns.map((column) => (
            <div key={column.field.id} data-meta-column={column.field.id}>
              <Field field={column.field} />
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
