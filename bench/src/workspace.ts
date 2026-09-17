import fs from 'node:fs';
import path from 'node:path';

import { templateDir } from './paths.ts';
import type { TemplateName } from './types.ts';

const EXCLUDED = new Set(['node_modules', 'dist', 'coverage', 'data', '.DS_Store']);

/** Fresh copy of the template. node_modules is shared through a symlink to keep it fast. */
export function createWorkspace(dir: string, template: TemplateName = 'frontend'): void {
  const source = templateDir(template);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  fs.cpSync(source, dir, {
    recursive: true,
    filter: (source) => !EXCLUDED.has(path.basename(source)),
  });
  fs.symlinkSync(path.join(source, 'node_modules'), path.join(dir, 'node_modules'));
}

/** Copies every file under `from` onto the workspace, keeping relative paths. */
export function overlay(workspace: string, from: string): string[] {
  const written: string[] = [];
  const walk = (current: string) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const source = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(source);
        continue;
      }
      const relative = path.relative(from, source);
      const target = path.join(workspace, relative);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(source, target);
      written.push(relative);
    }
  };
  if (fs.existsSync(from)) walk(from);
  return written;
}

/** Snapshot of the given relative files so a mutant can be reverted. */
export function snapshot(workspace: string, relatives: string[]): Map<string, string | null> {
  const saved = new Map<string, string | null>();
  for (const relative of relatives) {
    const file = path.join(workspace, relative);
    saved.set(relative, fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null);
  }
  return saved;
}

export function restore(workspace: string, saved: Map<string, string | null>): void {
  for (const [relative, content] of saved) {
    const file = path.join(workspace, relative);
    if (content === null) fs.rmSync(file, { force: true });
    else fs.writeFileSync(file, content);
  }
}

export function listFiles(dir: string): string[] {
  const files: string[] = [];
  const walk = (current: string) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else files.push(path.relative(dir, full));
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return files;
}
