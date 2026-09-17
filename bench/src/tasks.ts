import fs from 'node:fs';
import path from 'node:path';

import { TASKS_DIR } from './paths.ts';
import type { Check, Task, TaskMeta } from './types.ts';

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

export function loadTask(id: string): Task {
  const dir = path.join(TASKS_DIR, id);
  if (!fs.existsSync(dir)) throw new Error(`Unknown task: ${id}`);
  const meta = readJson<TaskMeta>(path.join(dir, 'task.json'));
  const mutantsDir = path.join(dir, 'mutants');
  const checksFile = path.join(dir, 'checks.json');
  return {
    ...meta,
    dir,
    prompt: fs.readFileSync(path.join(dir, 'prompt.md'), 'utf8').trim(),
    hasSetup: fs.existsSync(path.join(dir, 'setup')),
    hasSolution: fs.existsSync(path.join(dir, 'solution')),
    mutants: fs.existsSync(mutantsDir)
      ? fs.readdirSync(mutantsDir).filter((name) => !name.startsWith('.')).sort()
      : [],
    checks: fs.existsSync(checksFile) ? readJson<Check[]>(checksFile) : [],
  };
}

export function listTaskIds(): string[] {
  return fs
    .readdirSync(TASKS_DIR)
    .filter((name) => fs.existsSync(path.join(TASKS_DIR, name, 'task.json')))
    .sort();
}

export function loadTasks(selector: string | undefined): Task[] {
  if (!selector || selector === 'all') return listTaskIds().map(loadTask);
  // A selector is a comma-separated union of task ids, `tag:<tag>` and `difficulty:<n>`.
  const parts = selector.split(',').map((s) => s.trim());
  if (!parts.some((part) => part.includes(':'))) return parts.map(loadTask);
  const all = listTaskIds().map(loadTask);
  return all.filter((task) =>
    parts.some((part) => {
      if (part.startsWith('tag:')) return task.tags?.includes(part.slice(4)) ?? false;
      if (part.startsWith('difficulty:')) return String(task.difficulty) === part.slice(11);
      return task.id === part;
    }),
  );
}
