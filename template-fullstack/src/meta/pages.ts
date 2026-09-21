import { componentFor } from '@/meta/components';
import { isContainerRef, type MetaPage, pageSchema, pageUrl } from '@/meta/schema';

/**
 * Every `meta/pages/<id>.json`, read at build time by Vite. A new file is a new page; nothing else
 * needs to change. Invalid meta stops the app at startup with the reason, before a bad page can be
 * shown.
 */
const files = import.meta.glob('../../meta/pages/*.json', { eager: true, import: 'default' });

function load(): MetaPage[] {
  const pages: MetaPage[] = [];
  const errors: string[] = [];
  for (const [file, raw] of Object.entries(files).sort(([a], [b]) => a.localeCompare(b))) {
    const rel = file.replace(/^.*\/meta\//, 'meta/');
    const parsed = pageSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(`${rel}: ${issue.path.join('.') || '(root)'}: ${issue.message}`);
      }
      continue;
    }
    const expectedId = rel.replace(/^meta\/pages\//, '').replace(/\.json$/, '');
    if (parsed.data.id !== expectedId) {
      errors.push(`${rel}: id "${parsed.data.id}" must equal the file name`);
      continue;
    }
    for (const field of parsed.data.fields) {
      if (isContainerRef(field)) continue;
      try {
        componentFor(field.type);
      } catch (error) {
        errors.push(
          `${rel}: field "${field.id}": ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    pages.push(parsed.data);
  }
  const urls = pages.map((p) => pageUrl(p.name));
  for (const dup of urls.filter((x, i) => urls.indexOf(x) !== i)) {
    errors.push(`two pages map to the URL /${dup}`);
  }
  if (errors.length > 0) throw new Error(`invalid meta:\n  ${errors.join('\n  ')}`);
  return pages;
}

export const metaPages: MetaPage[] = load();
