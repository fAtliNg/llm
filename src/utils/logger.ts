import pc from 'picocolors';

export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

const ORDER: Record<LogLevel, number> = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 };

let current: LogLevel = 'info';

export function setLogLevel(level: LogLevel): void {
  current = level;
}

function enabled(level: Exclude<LogLevel, 'silent'>): boolean {
  return ORDER[current] >= ORDER[level];
}

export const logger = {
  error(msg: string): void {
    if (enabled('error')) console.error(`${pc.red('✖')} ${msg}`);
  },
  warn(msg: string): void {
    if (enabled('warn')) console.warn(`${pc.yellow('▲')} ${msg}`);
  },
  info(msg: string): void {
    if (enabled('info')) console.log(msg);
  },
  step(msg: string): void {
    if (enabled('info')) console.log(`${pc.cyan('→')} ${msg}`);
  },
  success(msg: string): void {
    if (enabled('info')) console.log(`${pc.green('✔')} ${msg}`);
  },
  debug(msg: string): void {
    if (enabled('debug')) console.log(pc.dim(`  ${msg}`));
  },
};
