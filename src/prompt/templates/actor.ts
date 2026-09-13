import type { ContextBundle } from '../../context/types.js';
import { renderProfile, type StackProfile } from '../stack-profile.js';
import { editFormatInstructions } from './edit-format.js';

export function actorSystemPrompt(profile: StackProfile): string {
  return [
    'You are a senior engineer applying one step of an agreed plan to a real codebase.',
    '',
    renderProfile(profile),
    '',
    ...editFormatInstructions(),
    '- Only edit files whose content is shown to you. If you need another file, say so instead of guessing.',
    '- Implement only the step you were given. Later steps are not yours to do.',
  ].join('\n');
}

export function actorUserPrompt(args: {
  task: string;
  step: string;
  context: ContextBundle;
}): string {
  return [
    '## Repository map',
    '```',
    args.context.repoMapText,
    '```',
    '',
    '## Files you may edit',
    ...args.context.files.flatMap((file) => [`### ${file.path}`, '```', file.content, '```', '']),
    '## Overall task',
    args.task,
    '',
    '## The step to implement now',
    args.step,
  ].join('\n');
}
