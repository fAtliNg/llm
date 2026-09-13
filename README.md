# lvc — Local Vibe Coding

A coding agent that runs entirely on your own machine. No API keys, no code leaving your laptop,
no subscription.

> **Status: early skeleton.** The loop runs end to end against a local model and lands single-file
> changes. It does not yet reliably finish changes that span several files. Numbers below are
> observations from a handful of runs, not a benchmark — building the benchmark is the next task.

## The idea

Instead of one large general model, use a small one that has been specialized hard on a single
fullstack stack, and surround it with a harness that catches its mistakes deterministically:

- a **semantic repo map** so the model sees the shape of the whole project in a fraction of the context
- an **edit format** built for models that cannot count lines
- a **self-correction loop** that runs your compiler, linter and tests, and feeds their errors back

The harness is the product. A 7B model is not a frontier model; inside a frozen stack, with the
mistakes it reliably makes caught in code rather than asked about in a prompt, it may not need to be.

## Requirements

- Node.js 22.12+ (`nvm use` picks it up from `.nvmrc`)
- [Ollama](https://ollama.com) running locally
- A code model: `ollama pull qwen2.5-coder:7b` (~4.7 GB)
- 16 GB RAM, or a GPU with 8 GB+

## Getting started

```bash
npm install
npm run build
node dist/index.js doctor
```

`doctor` tells you exactly what is missing — memory, git, backend, model, or headroom.

In the project you want to work on:

```bash
lvc init                 # write .lvc/config.json
lvc map                  # see what the model would see, and what it costs in tokens
lvc run "add an optional discountPercent field to CartItem and apply it in cartTotal"
```

The agent refuses to start on a dirty working tree and records a git checkpoint before its first
write, so every run is reviewable with `git diff` and undoable with `git checkout -- .`.

## How it works

```
plan ──> for each step: edit ──> verify ──> repair* ──> done
```

It plans in one turn and edits in another, because the two want different things from the model:
planning wants the whole repository map and a little sampling, editing wants a few complete files
and near-determinism. After every step it runs your own gates — `tsc`, ESLint, your tests — and
feeds any failure back with the files the errors point at. When it cannot converge within its repair
budget, it stops and says so rather than thrashing.

See [CLAUDE.md](CLAUDE.md) for the project context, [docs/architecture.md](docs/architecture.md)
for the design, and [docs/adr/](docs/adr/) for why each decision went the way it did.

## Configuration

`.lvc/config.json` holds the knobs that matter on constrained hardware: context window and how it
is divided, sampling temperatures, the verification commands, the repair budget, and the command
allowlist. `lvc init` writes it with every default spelled out.

## Contributing

```bash
npm run verify    # typecheck + lint + test
```

Two house rules, both learned the hard way (the evidence is in
[docs/architecture.md](docs/architecture.md#observed-behaviour)):

1. If a model mistake can be caught in code, catch it in code. A rule the model must remember is a
   rule it will eventually forget.
2. Claims about model quality need a measurement. The eval suite is the next thing being built, and
   it is what any "it works better now" has to go through.

## License

MIT
