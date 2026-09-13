/**
 * A stack profile is the product's core asset: the frozen conventions of one fullstack stack,
 * stated once and injected into every prompt.
 *
 * It does double duty. Today it constrains a general model at inference time. Later the same
 * profile defines what a specialized model is fine-tuned on — the profile is the specification
 * that the training data must satisfy, so a model shipped for a profile can drop most of this
 * text from its prompt and win back context tokens.
 */
export interface StackProfile {
  id: string;
  title: string;
  /** Rules stated as commitments, not suggestions — the model must not deliberate about them. */
  conventions: string[];
  /** Commands this stack verifies itself with, overriding config defaults when set. */
  verify?: { typecheck?: string; lint?: string; test?: string };
}

export const reactNestProfile: StackProfile = {
  id: 'react19-nest-postgres',
  title: 'React 19 + TypeScript + RTK Query + Styled Components / NestJS + PostgreSQL + Docker',
  conventions: [
    'TypeScript everywhere. No `any`, no non-null assertions; model absence with explicit unions.',
    'React function components only. No class components, no default exports.',
    'Server state goes through RTK Query. Do not fetch in useEffect and do not hand-roll cache state.',
    'Local UI state uses useState/useReducer. Redux slices hold shared client state only.',
    'Styling is Styled Components; theme values come from the theme object, never hard-coded hex.',
    'NestJS is layered controller -> service -> repository. Controllers contain no business logic.',
    'DTOs are classes with class-validator decorators, validated by a global ValidationPipe.',
    'Database access is parameterised. String-built SQL is never acceptable.',
    'Every new module ships with its unit test alongside it.',
  ],
};

export const profiles: Record<string, StackProfile> = {
  [reactNestProfile.id]: reactNestProfile,
};

export function renderProfile(profile: StackProfile): string {
  return [
    `Target stack: ${profile.title}`,
    'Non-negotiable conventions:',
    ...profile.conventions.map((rule) => `- ${rule}`),
  ].join('\n');
}
