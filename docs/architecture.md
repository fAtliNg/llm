# Architecture

## The loop

```
run(task)
  ├── guard: working tree is clean, git exists          (a rewrite you cannot undo is not a feature)
  ├── guard: backend reachable, model pulled
  ├── plan ─────────────────────────────► repo map + ranked files ──► numbered steps
  ├── guard: gates already pass           (so a later failure is attributable)
  ├── checkpoint                          (git stash entry, working tree untouched)
  └── for each step:
        ├── act ──► context ──► SEARCH/REPLACE blocks ──► validate ──► write (all or nothing)
        ├── verify ──► typecheck ──► lint ──► test      (stop at the first failure)
        └── while failing and budget remains:
              └── heal ──► diagnostics + the files they name ──► edits ──► verify again
```

Two invariants shape everything else:

**Verification runs after every step, not once at the end.** A repair turn then has one step's worth
of blame to reason about. Verifying once at the end gives a 7B model a pile of errors from five
different changes and no way to attribute them.

**The repair budget is finite.** An agent that cannot converge must stop, leave the working tree
readable, and say so. Burning a laptop's battery rewriting the same file is worse than failing.

## Modules

| Module | Responsibility | Key decision |
|---|---|---|
| `llm/` | Inference behind one interface | Nothing above this layer knows the backend. Ollama today, bundled llama.cpp later, a remote API during evaluation. |
| `context/` | Repository → the exact bytes the model sees | Per-file parsing, not a full TypeScript Program: a Program costs seconds and hundreds of megabytes on a machine that has neither to spare. |
| `prompt/` | Stack profiles, templates, edit format | The format spec lives in one place because a repair turn starts a fresh conversation — "the same format as before" refers to a history it cannot see. |
| `tools/` | Writes, commands, gates, checkpoints | The shell is an allowlist, not a shell. An autonomous loop with arbitrary execution is a different product with a different risk profile. |
| `agent/` | Sequencing, budgets, attribution | Emits an event stream; the CLI renders it, and eval runs record it, without either knowing about the other. |

## Why the seams are where they are

Three things are expected to change, so each sits behind an interface:

- **The model and its host** (`LlmBackend`). Specialized models are the roadmap; the harness must
  not care which one is loaded.
- **The language** (`LanguageAnalyzer`). TypeScript is the target stack, not the final scope.
- **The stack conventions** (`StackProfile`). Each profile is a marketplace entry. Today it
  constrains a general model at inference time; later it is the specification the fine-tuned model
  is trained against, and a model shipped for a profile can drop most of that text from its prompt
  and win back context tokens.

Deliberately *not* abstracted: the edit format. One format, tested hard, is worth more than a
pluggable interface over three mediocre ones — and the format is also the shape of the future
training data, so it wants to be a single stable target.

## Safety model

The agent rewrites files without asking. The guarantee is not "it will not make a mess" but "any
mess is one command away from gone":

- git is required; a dirty tree is refused, so the diff is always the agent's own work
- a stash-backed checkpoint is recorded before the first write
- writes are all-or-nothing per step — a half-applied batch leaves a state nobody can reason about
- writes cannot escape the repository root
- commands are allowlisted by prefix

## Observed behaviour

From the first end-to-end runs against Qwen 2.5 Coder 7B (Q4_K_M) on an M2 Pro, 16 GB. These drove
real design changes, and are recorded because they are the baseline the specialized model must beat.

| Observation | Response |
|---|---|
| Plans repeat themselves; bare filenames appear as "steps" | Plan normalization: dedupe by action fingerprint, drop non-actionable lines, cap the step count |
| Reasoning bullets above the plan parsed as steps | When a numbered list exists, it is the plan; loose bullets are noise |
| The model copied the example path `path/to/file.ts` out of the prompt | Edit paths are validated against the files actually shown |
| The model copied `taxRate` out of a worked example resembling the task | Examples now live in an unrelated domain |
| Removing the worked example broke format compliance entirely | Small models learn format from examples, not descriptions. Keep the example; enforce correctness in code |
| An escape hatch offered upfront was taken for every step | It is offered only after an attempt fails with "text not found" — the one case where it is legitimate |
| A gate failed because the project had no TypeScript installed, and the agent tried to "fix" it | Gates run once before editing; a failing baseline stops the run before any inference |
| Single-file changes succeed; a change spanning an interface and its use often does not converge | The genuine 7B ceiling. This is what specialization has to move, and what the eval harness has to measure |
