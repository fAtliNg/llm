import { componentFor } from '@/meta/components';
import {
  isBuiltin,
  isContainerRef,
  layoutSchema,
  type MetaLayout,
  type MetaPage,
  type MetaPanel,
  pageSchema,
  pageUrl,
  panelSchema,
} from '@/meta/schema';
import type { z } from 'zod';

/**
 * Everything under `meta/`, read at build time by Vite. A new file is a new page or layout; nothing
 * else needs to change. Invalid meta stops the app at startup with every problem listed, before a bad
 * page can be shown.
 */
const pageFiles = import.meta.glob('../../meta/pages/*.json', { eager: true, import: 'default' });
const layoutFiles = import.meta.glob('../../meta/layouts/*.json', {
  eager: true,
  import: 'default',
});
const panelFiles = import.meta.glob('../../meta/panels/*.json', { eager: true, import: 'default' });

function parseFolder<T extends { id: string; fields: Record<string, { type: string }> }>(
  files: Record<string, unknown>,
  folder: string,
  schema: z.ZodType<T>,
  errors: string[],
): T[] {
  const items: T[] = [];
  for (const [file, raw] of Object.entries(files).sort(([a], [b]) => a.localeCompare(b))) {
    const rel = file.replace(/^.*\/meta\//, 'meta/');
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(`${rel}: ${issue.path.join('.') || '(root)'}: ${issue.message}`);
      }
      continue;
    }
    const expectedId = rel.replace(`meta/${folder}/`, '').replace(/\.json$/, '');
    if (parsed.data.id !== expectedId) {
      errors.push(`${rel}: id "${parsed.data.id}" must equal the file name`);
      continue;
    }
    for (const [id, field] of Object.entries(parsed.data.fields)) {
      const f = field as MetaPage['fields'][string];
      if (isContainerRef(f) || isBuiltin(f)) continue;
      try {
        componentFor(f.type);
      } catch (error) {
        errors.push(
          `${rel}: fields.${id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    items.push(parsed.data);
  }
  return items;
}

function load(): { pages: MetaPage[]; layouts: MetaLayout[]; panels: MetaPanel[] } {
  const errors: string[] = [];
  const pages = parseFolder(pageFiles, 'pages', pageSchema, errors);
  const layouts = parseFolder(layoutFiles, 'layouts', layoutSchema, errors);
  const panels = parseFolder(panelFiles, 'panels', panelSchema, errors);
  const layoutIds = new Set(layouts.map((l) => l.id));
  const panelIds = new Set(panels.map((p) => p.id));

  // A `{ "type": "panel" }` field must name a panel that exists; a panel must not contain itself.
  const holders = [
    ...pages.map((p) => ({ file: `meta/pages/${p.id}.json`, self: '', fields: p.fields })),
    ...layouts.map((l) => ({ file: `meta/layouts/${l.id}.json`, self: '', fields: l.fields })),
    ...panels.map((p) => ({ file: `meta/panels/${p.id}.json`, self: p.id, fields: p.fields })),
  ];
  for (const holder of holders) {
    for (const [id, field] of Object.entries(holder.fields)) {
      if (field.type !== 'panel') continue;
      if (!panelIds.has(id))
        errors.push(`${holder.file}: fields.${id}: no panel "${id}" in meta/panels`);
      if (id === holder.self)
        errors.push(`${holder.file}: fields.${id}: a panel cannot contain itself`);
    }
  }

  const urls = pages.map((p) => pageUrl(p.name));
  for (const dup of urls.filter((x, i) => urls.indexOf(x) !== i)) {
    errors.push(`two pages map to the URL /${dup}`);
  }
  for (const page of pages) {
    if (page.layout !== undefined && !layoutIds.has(page.layout)) {
      errors.push(`meta/pages/${page.id}.json: layout "${page.layout}" is not in meta/layouts`);
    }
  }
  for (const layout of layouts) {
    if (layout.layout !== undefined && !layoutIds.has(layout.layout)) {
      errors.push(
        `meta/layouts/${layout.id}.json: layout "${layout.layout}" is not in meta/layouts`,
      );
    }
    // Walk outwards; meeting this layout again is a cycle.
    const seen = new Set<string>([layout.id]);
    let outer = layout.layout;
    while (outer !== undefined && layoutIds.has(outer)) {
      if (seen.has(outer)) {
        errors.push(`meta/layouts/${layout.id}.json: layouts nest in a cycle through "${outer}"`);
        break;
      }
      seen.add(outer);
      outer = layouts.find((l) => l.id === outer)?.layout;
    }
  }

  if (errors.length > 0) throw new Error(`invalid meta:\n  ${errors.join('\n  ')}`);
  return { pages, layouts, panels };
}

const loaded = load();

export const metaPages: MetaPage[] = loaded.pages;
export const metaLayouts: MetaLayout[] = loaded.layouts;
export const metaPanels: MetaPanel[] = loaded.panels;

export function findPanel(id: string): MetaPanel | undefined {
  return metaPanels.find((panel) => panel.id === id);
}

/** The page that opens at a URL path (without the leading slash), if meta has one. */
export function findPage(urlPath: string): MetaPage | undefined {
  const wanted = urlPath.replace(/^\/+|\/+$/g, '');
  return metaPages.find((page) => pageUrl(page.name) === wanted);
}

/** The layouts around a page, innermost first: the page's own, then the one that wraps it, and so on. */
export function layoutChain(page: MetaPage): MetaLayout[] {
  const chain: MetaLayout[] = [];
  let id = page.layout;
  while (id !== undefined) {
    const layout = metaLayouts.find((l) => l.id === id);
    if (!layout || chain.includes(layout)) break;
    chain.push(layout);
    id = layout.layout;
  }
  return chain;
}
