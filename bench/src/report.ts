import fs from 'node:fs';
import path from 'node:path';

import { RESULTS_DIR } from './paths.ts';
import type { RunResult } from './types.ts';

function collect(runId?: string): RunResult[] {
  const results: RunResult[] = [];
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === 'result.json') results.push(JSON.parse(fs.readFileSync(full, 'utf8')) as RunResult);
    }
  };
  walk(runId ? path.join(RESULTS_DIR, runId) : RESULTS_DIR);
  // validate/null runs have no agent section; keep only real runs.
  return results.filter((r) => r.agent !== undefined);
}

function minutes(seconds: number): string {
  return (seconds / 60).toFixed(1);
}

function pct(solved: number, total: number): string {
  return total === 0 ? '-' : `${String(Math.round((100 * solved) / total))}% (${String(solved)}/${String(total)})`;
}

function table(title: string, rows: string[], cols: string[], cell: (row: string, col: string) => string): string {
  const lines = [`### ${title}`, '', `| config | ${cols.join(' | ')} | all |`, `|---|${cols.map(() => '---').join('|')}|---|`];
  for (const row of rows) lines.push(`| ${row} | ${cols.map((col) => cell(row, col)).join(' | ')} | ${cell(row, '*')} |`);
  return lines.join('\n');
}

export function report(runId?: string): string {
  const results = collect(runId);
  if (results.length === 0) return 'No results yet.';
  const configs = [...new Set(results.map((r) => r.config))].sort();
  const layers = [...new Set(results.map((r) => r.task.layer))].sort();
  const difficulties = ['1', '2', '3'];

  const stat = (config: string, predicate: (r: RunResult) => boolean) => {
    const subset = results.filter((r) => r.config === config && predicate(r));
    return pct(subset.filter((r) => r.grade.solved).length, subset.length);
  };

  const byLayer = table('Solved by layer', configs, layers, (config, layer) =>
    stat(config, (r) => layer === '*' || r.task.layer === layer),
  );
  const byDifficulty = table('Solved by difficulty', configs, difficulties, (config, d) =>
    stat(config, (r) => d === '*' || String(r.task.difficulty) === d),
  );
  const byFormulation = table('Solved by formulation', configs, ['spec', 'product'], (config, f) =>
    stat(config, (r) => f === '*' || r.task.formulation === f),
  );

  const reasons = ['### Failure reasons', '', '| config | reason | count |', '|---|---|---|'];
  for (const config of configs) {
    const counts = new Map<string, number>();
    for (const r of results.filter((x) => x.config === config && !x.grade.solved)) {
      const key = r.agent.timedOut ? 'timeout' : (r.grade.failureReason ?? 'unknown');
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    for (const [reason, count] of [...counts].sort((a, b) => b[1] - a[1])) {
      reasons.push(`| ${config} | ${reason} | ${String(count)} |`);
    }
  }

  const agent = ['### Agent behaviour', '', '| config | runs | ran verify | tool errors/run | turns/run | minutes/run |', '|---|---|---|---|---|---|'];
  for (const config of configs) {
    const subset = results.filter((r) => r.config === config);
    const avg = (f: (r: RunResult) => number) => (subset.reduce((s, r) => s + f(r), 0) / subset.length).toFixed(1);
    agent.push(
      `| ${config} | ${String(subset.length)} | ${pct(subset.filter((r) => r.agent.ranVerify).length, subset.length)} | ${avg((r) => r.agent.toolErrors)} | ${avg((r) => r.agent.turns)} | ${avg((r) => r.agent.wallSeconds / 60)} |`,
    );
  }

  const perTask = [
    '### Per task',
    '',
    '| task | config | rep | result | min | turns | tools | errors | verify runs | first edit (min) |',
    '|---|---|---|---|---|---|---|---|---|---|',
  ];
  const sorted = [...results].sort((a, b) =>
    a.task.id.localeCompare(b.task.id) || a.config.localeCompare(b.config) || a.rep - b.rep,
  );
  for (const r of sorted) {
    const tools = Object.entries(r.agent.toolCalls)
      .map(([name, count]) => `${name} ${String(count)}`)
      .join(', ');
    const outcome = r.grade.solved ? 'solved' : r.agent.timedOut ? 'timeout' : (r.grade.failureReason ?? 'failed');
    perTask.push(
      `| ${r.task.id} | ${r.config} | ${String(r.rep)} | ${outcome} | ${minutes(r.agent.wallSeconds)} | ${String(r.agent.turns)} | ${tools} | ${String(r.agent.toolErrors)} | ${String(r.agent.verifyRuns ?? 0)} | ${r.agent.firstEditAt === null || r.agent.firstEditAt === undefined ? '-' : minutes(r.agent.firstEditAt)} |`,
    );
  }

  const details = ['### Observations per run', ''];
  for (const r of sorted) {
    const d = r.diagnostics;
    details.push(`**${r.task.id} · ${r.config} · rep ${String(r.rep)}** — ${r.grade.solved ? 'solved' : `failed: ${r.grade.failureReason ?? 'timeout'}`}, ${minutes(r.agent.wallSeconds)} min`);
    if (d?.shape) details.push(`- shape: ${d.shape}`);
    for (const c of d?.comments ?? []) details.push(`- ${c}`);
    if (d?.changedFiles.length) details.push(`- changed: ${d.changedFiles.join(', ')}`);
    details.push('');
  }

  const timeByConfig = ['### Time per config', '', '| config | runs | median min | mean min | max min | total hours |', '|---|---|---|---|---|---|'];
  for (const config of configs) {
    const secs = results.filter((r) => r.config === config).map((r) => r.agent.wallSeconds).sort((a, b) => a - b);
    const mean = secs.reduce((s, x) => s + x, 0) / secs.length;
    const median = secs[Math.floor(secs.length / 2)] ?? 0;
    timeByConfig.push(`| ${config} | ${String(secs.length)} | ${minutes(median)} | ${minutes(mean)} | ${minutes(secs[secs.length - 1] ?? 0)} | ${(secs.reduce((s, x) => s + x, 0) / 3600).toFixed(1)} |`);
  }

  return [
    byLayer, '', byDifficulty, '', byFormulation, '', reasons.join('\n'), '', agent.join('\n'), '',
    timeByConfig.join('\n'), '', perTask.join('\n'), '', details.join('\n'),
  ].join('\n');
}
