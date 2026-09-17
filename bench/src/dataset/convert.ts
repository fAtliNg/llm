import fs from 'node:fs';
import path from 'node:path';

import { RESULTS_DIR } from '../paths.ts';
import type { RunResult } from '../types.ts';

/**
 * Turns solved benchmark/teacher runs into training examples.
 *
 * Output: JSONL, one object per trajectory, in the OpenAI-style chat format that the Qwen chat
 * template (and Unsloth) understand: `messages` with `tool_calls` on assistant turns and
 * `tool` turns carrying results, plus `tools` with the JSON schemas the student is served.
 */
interface ContentPart {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  arguments?: unknown;
  thinking?: string;
}

interface PiMessage {
  role: 'user' | 'assistant' | 'toolResult';
  content: ContentPart[] | string;
  toolCallId?: string;
  toolName?: string;
  isError?: boolean;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: { id: string; type: 'function'; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
}

export interface Example {
  messages: ChatMessage[];
  tools: unknown[];
  meta: { runId: string; config: string; task: string; rep: number; turns: number };
}

interface CapturedRequest {
  messages: { role: string; content: string }[];
  tools: unknown[];
}

function partsToText(content: ContentPart[] | string): string {
  if (typeof content === 'string') return content;
  return content
    .filter((part) => part.type === 'text')
    .map((part) => part.text ?? '')
    .join('');
}

/** Converts Pi's message list (from the agent_end event) into chat messages. */
export function toChat(messages: PiMessage[], system: string): ChatMessage[] {
  const out: ChatMessage[] = [{ role: 'system', content: system }];
  for (const message of messages) {
    if (message.role === 'user') {
      out.push({ role: 'user', content: partsToText(message.content) });
    } else if (message.role === 'assistant') {
      const parts = typeof message.content === 'string' ? [{ type: 'text', text: message.content }] : message.content;
      const calls = parts.filter((part) => part.type === 'toolCall');
      const entry: ChatMessage = { role: 'assistant', content: partsToText(parts) };
      if (calls.length > 0) {
        entry.tool_calls = calls.map((call) => ({
          id: call.id ?? '',
          type: 'function',
          function: {
            name: call.name ?? '',
            arguments: typeof call.arguments === 'string' ? call.arguments : JSON.stringify(call.arguments ?? {}),
          },
        }));
      }
      out.push(entry);
    } else {
      out.push({ role: 'tool', tool_call_id: message.toolCallId ?? '', content: partsToText(message.content) });
    }
  }
  return out;
}

/**
 * Pi emits one agent_end per agent run; after a provider error it retries in the same session,
 * so a transcript can hold several, each carrying only its own new messages. Concatenate them
 * and drop assistant messages that are empty (the errored turn).
 */
function agentEndMessages(transcript: string): PiMessage[] | null {
  const messages: PiMessage[] = [];
  let seen = false;
  for (const line of fs.readFileSync(transcript, 'utf8').split('\n')) {
    if (!line.startsWith('{"type":"agent_end"')) continue;
    seen = true;
    messages.push(...(JSON.parse(line) as { messages: PiMessage[] }).messages);
  }
  if (!seen) return null;
  return messages.filter((m) => {
    if (m.role !== 'assistant') return true;
    if (typeof m.content === 'string') return m.content.trim().length > 0;
    return m.content.some((c) => (c.type === 'text' && (c.text ?? '').trim().length > 0) || c.type === 'toolCall');
  });
}

export interface ConvertOptions {
  runIds: string[];
  /** Captured request with the student's system prompt and tool schemas. */
  captured: string;
  /** Keep only solved runs (default true). */
  solvedOnly?: boolean;
  /** Drop trajectories longer than this many assistant turns. */
  maxTurns?: number;
}

export function convert(options: ConvertOptions): Example[] {
  // The student's system prompt embeds the template's AGENTS.md, so every template has its own capture:
  // `student-request.json` for the front-end template, `student-request-fullstack.json` next to it.
  const load = (file: string) => {
    const captured = JSON.parse(fs.readFileSync(file, 'utf8')) as CapturedRequest;
    return { captured, system: captured.messages.find((m) => m.role === 'system')?.content ?? '' };
  };
  const frontend = load(options.captured);
  const fullstackFile = options.captured.replace(/\.json$/, '-fullstack.json');
  const fullstack = fs.existsSync(fullstackFile) ? load(fullstackFile) : null;
  const examples: Example[] = [];
  const walk = (dir: string, visit: (file: string) => void) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, visit);
      else if (entry.name === 'result.json') visit(full);
    }
  };
  for (const runId of options.runIds) {
    walk(path.join(RESULTS_DIR, runId), (file) => {
      const record = JSON.parse(fs.readFileSync(file, 'utf8')) as RunResult;
      if ((options.solvedOnly ?? true) && !record.grade.solved) return;
      const transcript = path.join(path.dirname(file), 'transcript.jsonl');
      if (!fs.existsSync(transcript)) return;
      const messages = agentEndMessages(transcript);
      if (!messages) return;
      const isFullstack = record.task.template === 'fullstack';
      if (isFullstack && !fullstack) throw new Error(`${fullstackFile} is missing: capture the student's request in the full-stack template first`);
      const { captured, system } = isFullstack && fullstack ? fullstack : frontend;
      const chat = toChat(messages, system);
      const turns = chat.filter((m) => m.role === 'assistant').length;
      if (options.maxTurns && turns > options.maxTurns) return;
      examples.push({
        messages: chat,
        tools: captured.tools,
        meta: { runId, config: record.config, task: record.task.id, rep: record.rep, turns },
      });
    });
  }
  return examples;
}

if (process.argv[1]?.endsWith('convert.ts')) {
  const [runIds = 'reference-deepseek-v1', outFile = 'dataset/examples.jsonl'] = process.argv.slice(2);
  const examples = convert({ runIds: runIds.split(','), captured: 'dataset/student-request.json' });
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, examples.map((e) => JSON.stringify(e)).join('\n') + '\n');
  const turns = examples.map((e) => e.meta.turns).sort((a, b) => a - b);
  console.log(`${String(examples.length)} examples → ${outFile}; assistant turns: min ${String(turns[0])}, median ${String(turns[Math.floor(turns.length / 2)])}, max ${String(turns[turns.length - 1])}`);
}
