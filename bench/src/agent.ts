import fs from 'node:fs';
import path from 'node:path';

import { exec } from './exec.ts';
import { PI_BIN, PI_HOME } from './paths.ts';
import type { AgentMetrics, BenchConfig, Task, ToolEvent } from './types.ts';

interface PiEvent {
  type: string;
  errorMessage?: string;
  toolName?: string;
  toolCallId?: string;
  args?: { command?: string; path?: string };
  isError?: boolean;
  result?: { content?: { type: string; text?: string }[] };
  message?: {
    role?: string;
    content?: { type: string; text?: string }[];
    usage?: { input?: number; output?: number };
    errorMessage?: string;
  };
  usage?: { input?: number; output?: number };
}

const VERIFY_COMMAND = /npm run (verify|test|typecheck|lint)|vitest|tsc|eslint/;

/** Runs Pi non-interactively in the workspace and distills the event stream into metrics. */
export async function runAgent(
  task: Task,
  config: BenchConfig,
  workspace: string,
  outDir: string,
): Promise<AgentMetrics> {
  fs.mkdirSync(outDir, { recursive: true });
  const transcript = fs.createWriteStream(path.join(outDir, 'transcript.jsonl'));

  const started = Date.now();
  const pendingCalls = new Map<string, ToolEvent>();
  const metrics: AgentMetrics = {
    timeline: [],
    firstEditAt: null,
    lastEditAt: null,
    verifyRuns: 0,
    turns: 0,
    toolCalls: {},
    toolErrors: 0,
    ranVerify: false,
    inputTokens: 0,
    outputTokens: 0,
    wallSeconds: 0,
    timedOut: false,
    exitCode: null,
    finalMessage: '',
    apiError: null,
  };

  const onLine = (line: string) => {
    transcript.write(`${line}\n`);
    let event: PiEvent;
    try {
      event = JSON.parse(line) as PiEvent;
    } catch {
      return;
    }
    switch (event.type) {
      case 'turn_end':
        metrics.turns += 1;
        break;
      case 'tool_execution_start': {
        const name = event.toolName ?? 'unknown';
        metrics.toolCalls[name] = (metrics.toolCalls[name] ?? 0) + 1;
        const at = Math.round((Date.now() - started) / 10) / 100;
        const target = (name === 'bash' ? event.args?.command : event.args?.path) ?? '';
        const entry: ToolEvent = { at, tool: name, target: target.slice(0, 300), ok: true };
        metrics.timeline.push(entry);
        if (event.toolCallId) pendingCalls.set(event.toolCallId, entry);
        if (name === 'bash' && VERIFY_COMMAND.test(target)) {
          metrics.ranVerify = true;
          metrics.verifyRuns += 1;
        }
        if (name === 'edit' || name === 'write') {
          metrics.firstEditAt ??= at;
          metrics.lastEditAt = at;
        }
        break;
      }
      case 'tool_execution_end': {
        const entry = event.toolCallId ? pendingCalls.get(event.toolCallId) : undefined;
        if (event.isError) {
          metrics.toolErrors += 1;
          if (entry) {
            entry.ok = false;
            entry.error = (event.result?.content ?? [])
              .map((part) => part.text ?? '')
              .join(' ')
              .slice(0, 200);
          }
        }
        if (event.toolCallId) pendingCalls.delete(event.toolCallId);
        break;
      }
      case 'message_end': {
        const apiError = event.message?.errorMessage ?? event.errorMessage;
        if (apiError) metrics.apiError = apiError.slice(0, 300);
        const usage = event.message?.usage ?? event.usage;
        if (usage) {
          metrics.inputTokens += usage.input ?? 0;
          metrics.outputTokens += usage.output ?? 0;
        }
        if (event.message?.role === 'assistant') {
          const text = (event.message.content ?? [])
            .filter((part) => part.type === 'text')
            .map((part) => part.text ?? '')
            .join('');
          if (text.trim()) metrics.finalMessage = text.trim();
        }
        break;
      }
      default:
        break;
    }
  };

  const args = [
    '--mode',
    'json',
    '--model',
    config.model,
    '--thinking',
    config.thinking,
    '--no-extensions',
    '--no-prompt-templates',
    '--no-themes',
    '--session-dir',
    path.join(outDir, 'session'),
    '--tools',
    config.tools ?? 'read,bash,edit,write',
    '-a',
  ];
  // Cloud reference runs: an API key from the environment beats any stored subscription login.
  if (config.model.startsWith('anthropic/') && process.env.ANTHROPIC_API_KEY) {
    args.push('--api-key', process.env.ANTHROPIC_API_KEY);
  }
  if (config.model.startsWith('google/') && process.env.GEMINI_API_KEY) {
    args.push('--api-key', process.env.GEMINI_API_KEY);
  }
  if (!config.contextFiles) args.push('--no-context-files');
  if (!config.skills) args.push('--no-skills');
  args.push('--', task.prompt);

  const result = await exec(PI_BIN, args, {
    cwd: workspace,
    timeoutMs: config.timeoutSec * 1000,
    env: { PI_OFFLINE: '1', PI_SKIP_VERSION_CHECK: '1', PI_TELEMETRY: '0', PI_CODING_AGENT_DIR: PI_HOME },
    onStdoutLine: onLine,
  });
  transcript.end();
  fs.writeFileSync(path.join(outDir, 'agent-stderr.log'), result.stderr);

  metrics.wallSeconds = result.seconds;
  metrics.timedOut = result.timedOut;
  metrics.exitCode = result.code;
  return metrics;
}
