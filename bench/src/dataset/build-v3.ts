import fs from 'node:fs';
import path from 'node:path';

import { BENCH_DIR } from '../paths.ts';
import { select } from './select.ts';
import type { Example } from './convert.ts';

/**
 * Dataset v3 (second cycle). To v2 it adds data aimed at what the fine-tuned 4B actually wastes turns
 * on (benchmark of 2026-09-19: re-reading the same file, series of edits on one spot, broken `edit`
 * calls, rare verify):
 *
 * - repair: synthetic breakages solved by the teacher in 6 turns flat;
 * - rescue: the model's own broken states on pool tasks, with the original goal and hidden tests;
 * - own: the fine-tuned model's own successes on pool tasks, its own style and shorter.
 *
 * Everything is a view over the stored runs: nothing is deleted, the mix is a build rule.
 *   node src/dataset/build-v3.ts [out=dataset/train-v3.jsonl]
 */
const OUT = process.argv[2] ?? 'dataset/train-v3.jsonl';

/** How many turns the trajectory spends re-reading a file it has already read. */
function reReads(example: Example): number {
  const seen = new Map<string, number>();
  for (const message of example.messages) {
    for (const call of message.tool_calls ?? []) {
      if (call.function.name !== 'read') continue;
      let path_: unknown;
      try {
        path_ = (JSON.parse(call.function.arguments) as { path?: unknown }).path;
      } catch {
        continue;
      }
      if (typeof path_ !== 'string') continue;
      seen.set(path_, (seen.get(path_) ?? 0) + 1);
    }
  }
  return [...seen.values()].reduce((sum, n) => sum + Math.max(0, n - 1), 0);
}

/** The longest run of edits to one file without anything in between: the "poke it again" pattern. */
function editStreak(example: Example): number {
  let best = 0;
  let current = 0;
  let last = '';
  for (const message of example.messages) {
    for (const call of message.tool_calls ?? []) {
      if (call.function.name !== 'edit' && call.function.name !== 'write') {
        continue;
      }
      let path_: unknown;
      try {
        path_ = (JSON.parse(call.function.arguments) as { path?: unknown }).path;
      } catch {
        continue;
      }
      if (typeof path_ !== 'string') continue;
      current = path_ === last ? current + 1 : 1;
      last = path_;
      best = Math.max(best, current);
    }
  }
  return best;
}

const isRu = (e: Example) => /[а-яё]/i.test(e.messages[1]?.content ?? '');
const byTask = (list: Example[]) => {
  // One example per task: the shortest trajectory, so the model learns the economical way.
  const best = new Map<string, Example>();
  for (const e of list) {
    const current = best.get(e.meta.task);
    if (!current || e.meta.turns < current.meta.turns) best.set(e.meta.task, e);
  }
  return [...best.values()];
};

function take(name: string, runIds: string[], options: { tidy?: boolean } = {}): Example[] {
  const { kept, report } = select({ runIds, captured: 'dataset/student-request.json' });
  let list = byTask(kept);
  if (options.tidy) {
    // Teacher trajectories are the bulk of the set: keep the tidy ones, so the habit being taught is
    // "read once, edit once" rather than "poke the same file five times".
    const before = list.length;
    list = list.filter((e) => reReads(e) <= 2 && editStreak(e) <= 2);
    console.log(`${name}: form filter dropped ${String(before - list.length)} of ${String(before)}`);
  }
  console.log(`${name}: ${String(list.length)} examples (${report.split('\n')[0] ?? ''})`);
  return list;
}

const teacher = take('teacher (full-stack pool)', ['teacher-fs-v1'], { tidy: true });
const repair = take('repair (synthetic breakages)', ['teacher-repair-v1']);
const rescue = take('rescue (own broken states)', ['teacher-rescue-v1']);
const own = take("own successes of the fine-tuned 4B", ['ft4b-pool']);

// Front-end v1 without the mock layer: keeps the discipline learnt in the first iteration.
const v1all = select({ runIds: ['teacher-pilot', 'teacher-v1'], captured: 'dataset/student-request.json' });
const mockish = /msw|handlers\.ts|src\/mocks|mock/i;
const noMocks = byTask(v1all.kept).filter((e) => !mockish.test(e.messages[1]?.content ?? ''));
const v1Count = 200;
const step = noMocks.length / Math.min(v1Count, noMocks.length);
const v1 = Array.from({ length: Math.min(v1Count, noMocks.length) }, (_, i) => noMocks[Math.floor(i * step)]!);
console.log(`v1 front-end without mocks: ${String(v1.length)} of ${String(noMocks.length)}`);

const all = [...teacher, ...repair, ...rescue, ...own, ...v1];
const tokens = all.reduce((sum, e) => sum + JSON.stringify(e.messages).length / 5, 0);
const out = path.join(BENCH_DIR, OUT);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, all.map((e) => JSON.stringify(e)).join('\n') + '\n');
console.log(
  `\nwritten ${String(all.length)} examples to ${out}\n` +
    `  teacher ${String(teacher.length)}, repair ${String(repair.length)}, rescue ${String(rescue.length)}, own ${String(own.length)}, v1 ${String(v1.length)}\n` +
    `  russian ${String(all.filter(isRu).length)}, about ${(tokens / 1e6).toFixed(2)}M tokens, median turns ${String(
      [...all].map((e) => e.meta.turns).sort((a, b) => a - b)[Math.floor(all.length / 2)] ?? 0,
    )}`,
);
