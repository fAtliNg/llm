# Context strategy

The whole product is a budgeting problem. A 7B model at Q4_K_M occupies ~4.8 GB; the KV cache for a
16k window occupies roughly another 1–2 GB depending on the backend's cache precision. On a 16 GB
machine that also runs an editor, a browser and the project's own toolchain, the window is not
going to grow. So the question is never "how do we fit more in" — it is "what earns its place".

## The allocation

Shares of the window, not absolute numbers, so a bigger machine scales every section at once
(`context.*` in `.lvc/config.json`):

| Section | Share | Holds |
|---|---|---|
| Repo map | 25% | Every file, with exported symbols and signatures |
| Files | 45% | 2–4 complete files the task actually touches |
| History | 10% | Reserved for conversational turns |
| Reserve | remainder | System prompt and the model's own output |

`model.maxOutputTokens` is subtracted before any of this is divided, because output tokens compete
with input tokens for the same window.

## Why a map instead of the files

Feeding whole files does not scale past a trivial project, and feeding fragments makes editing
impossible — a model cannot write a SEARCH block against text it has not seen. The split:

- **The repo map** answers *where things are*: every file, its exported symbols, their signatures.
  Signatures only, never bodies. It is a table of contents, not the book.
- **Whole files** answer *what to change*: a handful, complete, so every SEARCH block has real text
  to anchor to.

A file that does not fit the remaining budget is skipped entirely rather than truncated. A partial
file is worse than no file: the model would anchor an edit to text it cannot see.

## Ranking

Phase 1 is a lexical heuristic — path and symbol-name overlap with the task, plus any files the plan
step named, plus anything the user pinned with `--file`.

Not embeddings, deliberately. An embedding model competes for the same RAM as the coder model, and
a heuristic that costs nothing is the right baseline to beat. When retrieval replaces this, it has
to beat the heuristic on the eval suite, not merely sound more sophisticated.

## Token counting

A conservative heuristic (~3.2 characters per token, plus 10% headroom), not a real tokenizer.
Qwen's BPE would mean a native dependency or a multi-megabyte vocab file, and the budgeter only
needs to be conservative — an underestimate means a hard context overflow at inference time, while
an overestimate costs a few unused tokens. Everything goes through `TokenCounter` so swapping in a
real tokenizer is one implementation.

## What breaks first

As projects grow, the map is the first thing to overflow its share. Planned responses, cheapest
first:

1. Drop non-exported symbols, then signatures, leaving bare paths
2. Rank *files* into the map, not just into the file section — a task about checkout does not need
   the admin panel's symbols
3. Cache the map on disk, keyed by mtime, so a large repository does not re-parse every run

None of these are built yet. The `map` command exists to make the overflow visible before it
silently degrades a run: it prints the rendered map, its token cost, and its allowance.
