import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import ignore from 'ignore';

export interface ScanOptions {
  root: string;
  /** Extra globs excluded on top of .gitignore. */
  exclude: string[];
  maxFileBytes: number;
}

export interface ScannedFile {
  /** Relative to root, POSIX separators. */
  path: string;
  absolutePath: string;
  bytes: number;
}

const SOURCE_GLOB = '**/*.{ts,tsx,js,jsx,mjs,cjs,json,css,scss,md,sql,prisma}';
const ALWAYS_IGNORED = ['**/node_modules/**', '**/.git/**', '**/.lvc/**'];

/** Walks the repository, honouring .gitignore, and returns candidate source files. */
export async function scanRepository(options: ScanOptions): Promise<ScannedFile[]> {
  const filter = ignore().add(await readGitignore(options.root));

  const entries = await fg(SOURCE_GLOB, {
    cwd: options.root,
    ignore: [...ALWAYS_IGNORED, ...options.exclude],
    dot: false,
    followSymbolicLinks: false,
    onlyFiles: true,
  });

  const kept = entries.filter((entry) => !filter.ignores(entry)).sort();

  const files: ScannedFile[] = [];
  for (const relative of kept) {
    const absolutePath = path.join(options.root, relative);
    const info = await stat(absolutePath);
    files.push({ path: relative, absolutePath, bytes: info.size });
  }
  return files;
}

async function readGitignore(root: string): Promise<string> {
  try {
    return await readFile(path.join(root, '.gitignore'), 'utf8');
  } catch {
    return '';
  }
}
