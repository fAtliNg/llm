import { z } from 'zod';

/**
 * Defaults are tuned for the baseline target: 16 GB unified memory, a 7B model at Q4_K_M
 * (~4.8 GB of weights) and a 16k context whose KV cache must fit beside them.
 */

export const backendSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('ollama'),
    baseUrl: z.string().url().default('http://127.0.0.1:11434'),
    requestTimeoutMs: z.number().int().positive().default(300_000),
  }),
  z.object({
    kind: z.literal('llama.cpp'),
    binaryPath: z.string().default(''),
    modelPath: z.string().default(''),
    requestTimeoutMs: z.number().int().positive().default(300_000),
  }),
]);

export const modelSchema = z.object({
  id: z.string().default('qwen2.5-coder:7b'),
  contextWindow: z.number().int().positive().default(16_384),
  /** Planning benefits from a little sampling; edits must be as deterministic as we can make them. */
  plannerTemperature: z.number().min(0).max(2).default(0.3),
  actorTemperature: z.number().min(0).max(2).default(0.05),
  maxOutputTokens: z.number().int().positive().default(2_048),
});

/**
 * Token allowances per context section. They are shares of the window, not absolute numbers,
 * so raising contextWindow on a bigger machine scales every section at once.
 */
export const contextSchema = z.object({
  repoMapShare: z.number().min(0).max(1).default(0.25),
  filesShare: z.number().min(0).max(1).default(0.45),
  historyShare: z.number().min(0).max(1).default(0.1),
  /** Files above this size are never inlined whole — only their extracted symbols. */
  maxFileBytes: z.number().int().positive().default(60_000),
  /** Extra ignore globs on top of .gitignore. */
  exclude: z
    .array(z.string())
    .default([
      '**/*.snap',
      '**/*.min.*',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/package-lock.json',
      '**/pnpm-lock.yaml',
      '**/yarn.lock',
    ]),
});

/**
 * The self-correction loop is only as good as these gates: each one turns a class of model
 * mistakes into a deterministic error string we can feed back.
 */
export const verifySchema = z.object({
  typecheck: z.string().default('npx tsc --noEmit'),
  lint: z.string().default('npm run lint --if-present'),
  test: z.string().default('npm test --if-present'),
  /** Give up after this many repair attempts and hand control back to the human. */
  maxRepairAttempts: z.number().int().min(0).default(3),
  /**
   * Run the gates once before editing and refuse to start if they already fail. Without this,
   * a pre-existing error — or a gate command that does not work on this machine — is blamed on
   * the model, and the repair loop burns its budget on code the agent never touched.
   */
  requireCleanBaseline: z.boolean().default(true),
  commandTimeoutMs: z.number().int().positive().default(120_000),
});

export const safetySchema = z.object({
  /** Snapshot the working tree before the agent writes, so a bad run is one command to undo. */
  checkpoint: z.boolean().default(true),
  /** Refuse to start when the working tree is dirty — the checkpoint is meaningless otherwise. */
  requireCleanTree: z.boolean().default(true),
  /** The agent may only run commands matching these prefixes. Shell access is not open-ended. */
  allowedCommands: z
    .array(z.string())
    .default([
      'npm run',
      'npm test',
      'npx tsc',
      'npx eslint',
      'npx vitest',
      'git status',
      'git diff',
    ]),
});

export const configSchema = z.object({
  $schema: z.string().optional(),
  backend: backendSchema.prefault({ kind: 'ollama' }),
  model: modelSchema.prefault({}),
  context: contextSchema.prefault({}),
  verify: verifySchema.prefault({}),
  safety: safetySchema.prefault({}),
});

export type LvcConfig = z.infer<typeof configSchema>;
export type VerifyConfig = z.infer<typeof verifySchema>;
export type ContextConfig = z.infer<typeof contextSchema>;

export const defaultConfig: LvcConfig = configSchema.parse({});
