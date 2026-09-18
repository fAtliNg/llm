import fs from 'node:fs';
import path from 'node:path';

import { BENCH_DIR } from '../paths.ts';
import { select } from './select.ts';

/**
 * Dataset v2: every selected full-stack trajectory (teacher runs on the full-stack pool), plus a
 * slice of the front-end dataset v1 that does not touch the MSW mock layer (the full-stack template
 * has a real API instead), so that the discipline learnt in v1 is not lost.
 *   node src/dataset/build-v2.ts [fullstackRunIds=teacher-fs-v1] [v1Runs=teacher-pilot,teacher-v1] [v1Count=200]
 * Writes bench/dataset/train-v2.jsonl and prints the composition.
 */
const [fsRuns = 'teacher-fs-v1', v1Runs = 'teacher-pilot,teacher-v1', v1CountArg = '200'] = process.argv.slice(2);
const v1Count = Number(v1CountArg);

const fullstack = select({ runIds: fsRuns.split(','), captured: 'dataset/student-request.json' });
console.log('full-stack:\n' + fullstack.report);

const v1 = select({ runIds: v1Runs.split(','), captured: 'dataset/student-request.json' });
const mockish = /msw|handlers\.ts|src\/mocks|mock/i;
const noMocks = v1.kept.filter((e) => !mockish.test(e.messages[1]?.content ?? ''));
// Deterministic spread over the whole list keeps the mix of task types.
const step = noMocks.length / Math.min(v1Count, noMocks.length);
const slice = Array.from({ length: Math.min(v1Count, noMocks.length) }, (_, i) => noMocks[Math.floor(i * step)]!);
console.log(`v1: kept ${String(v1.kept.length)}, without mocks ${String(noMocks.length)}, taking ${String(slice.length)}`);

const all = [...fullstack.kept, ...slice];
const isRu = (e: (typeof all)[number]) => /[а-яё]/i.test(e.messages[1]?.content ?? '');
const stage3 = fullstack.kept.filter((e) => /entity|child/.test(e.meta.task)).length;
const out = path.join(BENCH_DIR, 'dataset', 'train-v2.jsonl');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, all.map((e) => JSON.stringify(e)).join('\n') + '\n');
console.log(`written ${String(all.length)} examples to ${out}: full-stack ${String(fullstack.kept.length)} (stage 3: ${String(stage3)}), v1 ${String(slice.length)}, russian ${String(all.filter(isRu).length)}`);
