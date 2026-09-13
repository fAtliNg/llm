# Roadmap

Ordered by what most reduces uncertainty, not by what is most fun to build.

## Now — the skeleton runs

Done: CLI, Ollama backend, repo map over the TypeScript compiler API, SEARCH/REPLACE format with a
tested parser and applier, two-stage plan→act loop, verification gates, repair loop, git checkpoints.

The loop demonstrably plans, edits, verifies, repairs and stops cleanly against a local 7B model.
Single-file changes land. Changes spanning an interface and its uses often do not converge.

## Next — measurement, before any more tuning

**This is the gate on everything else.** Right now every claim about quality is anecdote, and
prompt tuning without a scoreboard is guesswork that feels like progress.

- A task suite in the target stack: ~30 tasks with a fixture repository each, graded automatically
  by the project's own gates (does it typecheck, does it lint, do the tests pass) plus a diff
  review for tasks where passing is not the same as correct.
- Record per run: pass rate, wall-clock, tokens, repair attempts used, and *why* a failure happened
  (format, non-applying edit, unconverged repair, wrong behaviour).
- Run the same suite across 1.5B / 7B / 14B / 32B. This is the honest answer to "how much does
  size actually buy us here", and the 14B and 32B numbers are the ceiling a specialized 7B is
  trying to reach.

Only once this exists does prompt or model work mean anything.

## Then — specialization, in the order the risk falls

1. **Stack profile in the prompt** (done for one stack) — the cheap version of the thesis. Measure it.
2. **Chain-of-thought distillation** — collect plan/edit/repair traces from a large model on the
   task suite, keep only the traces whose edits actually passed the gates.
3. **LoRA fine-tune** on those traces, in this project's exact edit format. Merge, quantize to
   Q4_K_M, ship as a GGUF. Re-run the suite; the comparison is against the same 7B unmodified.
4. **Bundled llama.cpp backend** so installation is one step and Ollama is optional.

## Later — what makes it an ecosystem

- Profile marketplace: profile + model + eval results as one installable unit, so a claim about a
  model is always accompanied by the suite it was measured on
- Additional languages via `LanguageAnalyzer` (tree-sitter, once TypeScript is proven)
- Design-system mapping (Pixso API) as a profile extension
- Disk-cached repo map for large repositories
- Editor integration over the existing agent event stream

## Open questions

- Does specialization actually close the gap on multi-file changes, or only on boilerplate? The
  suite must contain enough of both to tell.
- Is a 16k window enough for a real feature, or does the product need a 32k model and 12 GB of
  headroom — which would change the target hardware?
- Is Qwen 2.5 Coder still the right base? It was chosen for availability at this size; the backend
  abstraction exists so this can be re-decided on evidence.
