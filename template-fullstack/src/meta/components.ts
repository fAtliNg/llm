import type { ComponentType } from 'react';

/**
 * Maps a field `type` to its component: the folder `src/components/ui/<type>` and the export named
 * after it in PascalCase (`button` -> `Button`, `input-group` -> `InputGroup`).
 */
const modules = import.meta.glob<Record<string, unknown>>('../components/ui/*/index.ts', {
  eager: true,
});

export type MetaComponent = ComponentType<Record<string, unknown>>;

function pascal(kebab: string): string {
  return kebab.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase());
}

export function componentFor(type: string): MetaComponent {
  const mod = modules[`../components/ui/${type}/index.ts`];
  if (!mod) throw new Error(`no component "${type}" in src/components/ui`);
  const name = pascal(type);
  const component = mod[name];
  if (typeof component !== 'function' && typeof component !== 'object') {
    throw new Error(
      `src/components/ui/${type} exports ${Object.keys(mod).join(', ')}, not ${name}`,
    );
  }
  return component as MetaComponent;
}
