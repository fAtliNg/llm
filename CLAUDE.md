# lvc — Local Vibe Coding

An offline coding agent driven by a small, specialized local model. Private by construction, free,
and runnable on an ordinary laptop.

## The bet

Do not scale the model — narrow it. Take a compact open code model (baseline: Qwen 2.5 Coder 7B at
Q4_K_M, ~4.8 GB), specialize it hard on **one** fullstack stack, and surround it with a harness that
catches its mistakes deterministically: a semantic repo map, an edit format it cannot mangle, and a
self-correction loop driven by the project's own compiler and tests.

Target hardware: MacBook with 16 GB unified memory, or a PC with a single RTX 4070-class GPU.

**The harness is the product, not the weights.** A 7B model will not match a frontier model in
general. It may match one inside a frozen stack on shaped work — and that claim is to be measured,
never assumed. Every design choice prefers a deterministic check over a rule the model must
remember.

## Commands

```bash
npm run dev -- doctor        # can this machine run it
npm run dev -- map           # the repo map the model would see
npm run dev -- run "<task>"  # plan, edit, verify, repair
npm run verify               # typecheck + lint + test (run before every commit)
```

Node 22.12+ is required (see `.nvmrc`). Ollama must be running for the default backend.

## Architecture

```
CLI ──> Agent ──> Planner ──> ContextManager ──> RepoMap (TypeScript compiler API)
             ├──> Actor   ──> PromptEngine  ──> LlmBackend (Ollama | llama.cpp)
             └──> Healer  <── VerifyTool    ──> ShellTool (allowlisted commands)
```

The loop: `plan -> for each step: edit -> verify -> repair* -> done`.

- `src/llm/` — backends behind one narrow interface. Nothing above this layer knows about Ollama.
- `src/context/` — scanner, TypeScript analyzer, repo map, ranker, token budget. **The component
  the product lives or dies by**: with a 16k window, what is left out matters more than what the
  model does with what is left in.
- `src/prompt/` — stack profiles, templates, the SEARCH/REPLACE edit format and its parser.
- `src/tools/` — editor (all-or-nothing writes), shell (allowlist only), verify gates, git checkpoints.
- `src/agent/` — the driver: planner, actor, healer, and the loop that sequences them.

Details: [docs/architecture.md](docs/architecture.md) · [docs/context-strategy.md](docs/context-strategy.md) · [docs/roadmap.md](docs/roadmap.md)

Decisions and their reasoning: [docs/adr/](docs/adr/)

## Working rules

- **Deterministic beats instructed.** If a model mistake can be caught in code, catch it in code.
  Every prompt rule that can be enforced by a parser eventually is.
- **Never widen an escape hatch.** Anything that lets the agent declare success without doing the
  work will be taken every time. Offer it only in the narrow case where it is legitimate.
- **Examples in prompts leak.** Small models copy identifiers and paths out of worked examples.
  Keep examples in an unrelated domain, and validate the output against reality anyway.
- **Attribute failures honestly.** The gates run once before editing; a project that already fails
  is not the agent's fault and must not consume its repair budget.
- **The token budget is a real budget.** New context costs something else its place. Say what it
  displaces.
- Every behavioural claim about model quality gets a measurement or it does not go in the README.

## State

The skeleton runs end to end against a local Qwen 2.5 Coder 7B: plan, edit, verify, repair, and a
clean stop that leaves a reviewable diff. What the loop cannot yet do reliably is finish a
multi-file change — see [docs/roadmap.md](docs/roadmap.md) for what is measured and what is next.
