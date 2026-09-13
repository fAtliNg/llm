import path from 'node:path';
import { Command } from 'commander';
import { BIN_NAME, PRODUCT_NAME } from '../constants.js';
import { setLogLevel } from '../utils/logger.js';
import { doctorCommand } from './commands/doctor.js';
import { initCommand } from './commands/init.js';
import { mapCommand } from './commands/map.js';
import { runCommand } from './commands/run.js';

export function buildProgram(): Command {
  const program = new Command();

  program
    .name(BIN_NAME)
    .description(`${PRODUCT_NAME} — an offline coding agent driven by a local model`)
    .version('0.0.0')
    .option('-C, --cwd <path>', 'run against another directory', process.cwd())
    .option('-v, --verbose', 'print debug output', false)
    .hook('preAction', (command) => {
      if (command.opts().verbose === true) setLogLevel('debug');
    });

  const root = (): string => path.resolve(program.opts().cwd as string);

  program
    .command('init')
    .description('write .lvc/config.json with the default settings')
    .option('-f, --force', 'overwrite an existing config')
    .action(async (options: { force?: boolean }) => {
      process.exitCode = await initCommand(root(), options);
    });

  program
    .command('doctor')
    .description('check that this machine can run the agent')
    .action(async () => {
      process.exitCode = await doctorCommand(root());
    });

  program
    .command('map')
    .description('print the repository map the model would see')
    .option('--json', 'emit the raw map instead of the rendered text')
    .action(async (options: { json?: boolean }) => {
      process.exitCode = await mapCommand(root(), options);
    });

  program
    .command('run')
    .argument('<task>', 'what you want done, in plain language')
    .description('plan, edit and verify until the project builds')
    .option('-f, --file <path...>', 'always include these files in context')
    .option('--plan-only', 'stop after printing the plan')
    .option('--thinking', "show the model's reasoning")
    .action(async (task: string, options) => {
      process.exitCode = await runCommand(root(), task, options);
    });

  return program;
}
