# ADR 0001 — SEARCH/REPLACE as the edit format

**Status:** accepted · 2026-09-13

## Context

The model has to express file changes in text we can apply mechanically. The format is the single
highest-leverage choice in the system: it decides how often edits apply at all, how many output
tokens each change costs, and — since these traces become training data — what the specialized
model will eventually be fine-tuned to produce.

Three candidates:

- **Unified diff** — compact, and it matches the format of training data mined from git history.
  But it requires correct line numbers and hunk headers, and a 7B model cannot reliably count
  lines. Errors are frequent and the failure is silent when a hunk applies at the wrong offset.
- **Whole-file rewrite** — trivially parseable. But output tokens are the scarcest resource in a
  16k window, and on longer files models drop unrelated sections they were supposed to preserve.
- **SEARCH/REPLACE blocks** — the model quotes the text to find and the text to put there. No
  counting, no line numbers. Costs output proportional to the change, not the file.

## Decision

SEARCH/REPLACE blocks, with the parser and applier in `src/prompt/edit-format/`.

Matching is exact first, then indentation-insensitive. Models reproduce code correctly but
re-indent it constantly, and rejecting those edits would spend repair turns on whitespace. Nothing
looser is attempted: a fuzzy match that silently hits the wrong place costs far more than a failed
edit the model can retry.

An ambiguous match — the SEARCH text occurring more than once — is refused rather than resolved by
picking the first. The model is told to include more surrounding context.

Batches are all-or-nothing. A half-applied batch leaves the repository in a state neither the user
nor the model can reason about, and the repair turn would start from fiction.

## Consequences

- Output cost scales with the change, which is what makes a 16k window workable
- Failures are deterministic and specific, so the complaint fed back to the model is actionable
- Training data collected now is in the format the shipped model will be trained on
- Large refactors are noisier than a diff would be — accepted, since they are rare in the target
  workload and the model is worse at them anyway
- Only one format is supported. No pluggable interface: one format tested hard beats three mediocre
  ones, and a stable target matters more once it is also a training format
