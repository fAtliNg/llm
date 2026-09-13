import type { Diagnostic } from '../../tools/types.js';
import { renderProfile, type StackProfile } from '../stack-profile.js';
import { editFormatInstructions } from './edit-format.js';

export function healerSystemPrompt(profile: StackProfile): string {
  return [
    'You are fixing errors your own previous edit introduced.',
    '',
    renderProfile(profile),
    '',
    ...editFormatInstructions(),
    '- Fix the reported errors and nothing else.',
    '- Address the root cause. Never silence an error with a cast, `any`, or a disable comment.',
    '- If an error is caused by a file you cannot see, say so instead of guessing at its contents.',
  ].join('\n');
}

export function healerUserPrompt(args: {
  command: string;
  diagnostics: Diagnostic[];
  rawOutput: string;
  files: Array<{ path: string; content: string }>;
}): string {
  const failures =
    args.diagnostics.length > 0
      ? args.diagnostics.map((d) =>
          `${d.file}:${d.line}:${d.column} ${d.code ?? ''} ${d.message}`.trim(),
        )
      : [args.rawOutput];

  return [
    '## Current file contents',
    ...args.files.flatMap((file) => [`### ${file.path}`, '```', file.content, '```', '']),
    `## \`${args.command}\` failed with:`,
    '```',
    ...failures,
    '```',
  ].join('\n');
}
