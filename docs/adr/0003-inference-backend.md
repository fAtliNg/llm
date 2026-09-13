# ADR 0003 — Ollama first, llama.cpp behind the same interface

**Status:** accepted · 2026-09-13

## Context

The tool needs local inference on machines we do not control. Two routes: drive a bundled llama.cpp
binary against a GGUF file, or talk to a local Ollama server over HTTP.

llama.cpp is the better end state — one install step, no external daemon, full control over cache
precision and sampling. It is also a pile of work that has nothing to do with the product thesis:
binaries per platform, model download and verification, process supervision, GPU layer negotiation.

Ollama already solves all of that, is installed on most machines in the target audience, and speaks
a stable HTTP API.

## Decision

Ship the Ollama backend first. Define `LlmBackend` narrowly enough that llama.cpp can implement it
later without anything above the layer changing, and keep an unimplemented `LlamaCppBackend` in the
tree as a standing check on that claim: if the rest of the codebase cannot be written against the
interface without reaching for Ollama specifics, the abstraction is wrong and we find out early
rather than at port time.

## Consequences

- Time goes to the context and loop design, which is where the thesis lives
- Users need Ollama installed — a real adoption cost, and the reason the llama.cpp backend stays on
  the roadmap rather than being dropped
- Cache precision and low-level sampling are Ollama's to decide for now, which limits some memory
  tuning on 16 GB machines
- The same interface takes a remote API implementation, which is how the eval suite will compare
  local models against a frontier baseline
