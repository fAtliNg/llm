/**
 * Splits a raw model reply into its reasoning and its payload.
 *
 * Small models reason visibly or not at all, so we ask for an explicit <thinking> section and
 * strip it before parsing edits. Keeping the two separate also means the reasoning can be shown
 * to the user, logged for distillation datasets, and dropped from follow-up turns to save
 * context — all without touching the edit parser.
 */
export interface SplitReply {
  thinking: string | null;
  body: string;
}

const THINKING_PATTERN = /<thinking>([\s\S]*?)<\/thinking>/i;

export function splitReply(raw: string): SplitReply {
  const match = raw.match(THINKING_PATTERN);
  if (!match) return { thinking: null, body: raw.trim() };

  return {
    thinking: (match[1] ?? '').trim(),
    body: raw.replace(THINKING_PATTERN, '').trim(),
  };
}

export interface PlanStep {
  index: number;
  description: string;
  /** Files the planner expects to touch. Feeds the context selection for the acting turn. */
  files: string[];
}

/**
 * Reads the planner's numbered step list. Tolerant of `1.`, `1)`, `-` and `*` bullets, because
 * enforcing a strict grammar on a 7B model costs more repair turns than parsing loosely does.
 */
export function parsePlan(body: string, options: { maxSteps?: number } = {}): PlanStep[] {
  const numbered: string[] = [];
  const bulleted: string[] = [];

  for (const line of body.split('\n')) {
    const numberedMatch = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (numberedMatch?.[1]?.trim()) {
      numbered.push(numberedMatch[1].trim());
      continue;
    }
    const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/);
    if (bulletMatch?.[1]?.trim()) bulleted.push(bulletMatch[1].trim());
  }

  // Models that reason without the <thinking> tags spill their deliberation as bullets above the
  // plan. When a numbered list exists it is the plan, and the bullets are noise.
  return normalizePlan(numbered.length > 0 ? numbered : bulleted, options.maxSteps ?? 6);
}

/**
 * Small models restate the same step several times and emit bare filenames as "steps". Left
 * alone, every duplicate costs a full edit turn on a machine where a turn is tens of seconds,
 * and re-editing a file the previous step already changed is how a run corrupts its own work.
 *
 * Filtering here rather than in the prompt is deliberate: a rule the model must remember is a
 * rule it will eventually forget, while a parser that drops junk works every time.
 */
export function normalizePlan(descriptions: string[], maxSteps: number): PlanStep[] {
  const steps: PlanStep[] = [];
  const seen = new Set<string>();

  for (const description of descriptions) {
    if (!isActionable(description)) continue;

    const fingerprint = fingerprintOf(description);
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);

    steps.push({ index: steps.length + 1, description, files: extractPaths(description) });
    if (steps.length === maxSteps) break;
  }

  return steps;
}

/** A step must say to do something. A bare path or a two-word fragment is not a step. */
function isActionable(description: string): boolean {
  const withoutCode = description.replace(/`[^`]*`/g, ' ').trim();
  if (withoutCode.split(/\s+/).filter(Boolean).length < 3) return false;
  return /\b(add|create|update|modify|change|remove|delete|rename|move|implement|extract|refactor|wire|register|import|export|write|replace|introduce|apply|handle|fix|split)\b/i.test(
    description,
  );
}

/**
 * Two steps are the same when they name the same action on the same things. Comparing on the
 * action verb plus the significant nouns catches "Update cartTotal" against "Update the
 * cartTotal function in src/cart.ts", which plain string equality does not.
 */
function fingerprintOf(description: string): string {
  // Paths are dropped first: "update cartTotal" and "update cartTotal in src/cart.ts" are the
  // same step, and leaving the path in would make them look different.
  const withoutPaths = description.replace(PATH_PATTERN, ' ');

  return [
    ...new Set(
      withoutPaths
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length >= 3 && !STOPWORDS.has(word)),
    ),
  ]
    .sort()
    .join(' ');
}

const STOPWORDS = new Set([
  'the',
  'this',
  'that',
  'with',
  'from',
  'into',
  'then',
  'also',
  'and',
  'for',
  'file',
  'function',
  'interface',
  'property',
  'method',
]);

const PATH_PATTERN = /[\w.\-/]+\.[a-z]{1,4}\b/gi;

function extractPaths(text: string): string[] {
  return [...new Set(text.match(PATH_PATTERN) ?? [])];
}
