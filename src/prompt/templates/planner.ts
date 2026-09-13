import type { ContextBundle } from '../../context/types.js';
import { renderProfile, type StackProfile } from '../stack-profile.js';

export function plannerSystemPrompt(profile: StackProfile): string {
  return [
    'You are a senior engineer planning a change in an existing codebase.',
    '',
    renderProfile(profile),
    '',
    'Answer in exactly two parts:',
    '1. A <thinking> section: what the change requires, which existing code it touches, what could break.',
    '2. A numbered plan. One line per step, each naming the files it touches.',
    '',
    'Rules:',
    '- Plan only what the request asks for. Do not invent adjacent work.',
    '- Prefer changing existing files over creating new ones.',
    '- Name real paths from the repository map. Never guess a path that is not listed.',
    '- Write no code in the plan. Code comes in a later turn.',
  ].join('\n');
}

export function plannerUserPrompt(task: string, context: ContextBundle): string {
  return [
    '## Repository map',
    '```',
    context.repoMapText,
    '```',
    '',
    ...(context.files.length > 0
      ? [
          '## Relevant files',
          ...context.files.flatMap((file) => [`### ${file.path}`, '```', file.content, '```', '']),
        ]
      : []),
    '## Task',
    task,
  ].join('\n');
}
