import pc from 'picocolors';
import { buildProgram } from './cli/program.js';
import { isUserFacingError } from './utils/errors.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
  const program = buildProgram();
  await program.parseAsync(process.argv);
}

main().catch((error: unknown) => {
  if (isUserFacingError(error)) {
    logger.error(error.message);
    if (error.hint) logger.info(pc.dim(`  ${error.hint}`));
  } else {
    logger.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  }
  process.exitCode = 1;
});
