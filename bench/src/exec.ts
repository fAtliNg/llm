import { spawn, type ChildProcess } from 'node:child_process';

const running = new Set<ChildProcess>();

/** Kills every child process group. Called on SIGINT/SIGTERM so a stopped run leaves no agent behind. */
export function killAll(): void {
  for (const child of running) {
    if (!child.pid) continue;
    try {
      process.kill(-child.pid, 'SIGKILL');
    } catch {
      child.kill('SIGKILL');
    }
  }
}

export interface ExecResult {
  code: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  seconds: number;
}

export interface ExecOptions {
  cwd: string;
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
  onStdoutLine?: (line: string) => void;
}

/** Runs a command, captures output, kills the whole process group on timeout. */
export function exec(cmd: string, args: string[], options: ExecOptions): Promise<ExecResult> {
  const started = Date.now();
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env, CI: '1', FORCE_COLOR: '0', NO_COLOR: '1' },
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    running.add(child);
    let stdout = '';
    let stderr = '';
    let pending = '';
    let timedOut = false;

    child.stdout.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stdout += text;
      if (options.onStdoutLine) {
        pending += text;
        const lines = pending.split('\n');
        pending = lines.pop() ?? '';
        for (const line of lines) options.onStdoutLine(line);
      }
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    const timer = options.timeoutMs
      ? setTimeout(() => {
          timedOut = true;
          if (child.pid) {
            try {
              process.kill(-child.pid, 'SIGKILL');
            } catch {
              child.kill('SIGKILL');
            }
          }
        }, options.timeoutMs)
      : null;

    child.on('close', (code) => {
      running.delete(child);
      if (timer) clearTimeout(timer);
      if (pending && options.onStdoutLine) options.onStdoutLine(pending);
      resolve({ code, stdout, stderr, timedOut, seconds: (Date.now() - started) / 1000 });
    });
    child.on('error', (error) => {
      running.delete(child);
      if (timer) clearTimeout(timer);
      resolve({ code: null, stdout, stderr: `${stderr}\n${String(error)}`, timedOut, seconds: 0 });
    });
  });
}

export function tail(text: string, lines = 40): string {
  return text.trim().split('\n').slice(-lines).join('\n');
}
