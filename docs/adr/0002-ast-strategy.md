# ADR 0002 — TypeScript compiler API for the repo map

**Status:** accepted · 2026-09-13

## Context

The repo map needs symbols and signatures from every file in the project, cheaply enough to run on
every invocation on a laptop.

- **tree-sitter** parses many languages and is what comparable tools use. But it is a native module:
  compilation on install, and a real distribution problem for a CLI meant to be easy to install.
  For TypeScript specifically it also yields less than the compiler does.
- **TypeScript compiler API** ships as an ordinary npm package, no native build, and gives exact
  signatures for the target stack — which is TypeScript on both ends.

## Decision

The TypeScript compiler API, behind a `LanguageAnalyzer` interface so other languages can be added
without touching the context manager.

Files are parsed individually with `createSourceFile`, not assembled into a `Program`. A Program
resolves the whole dependency graph, costing seconds and hundreds of megabytes on a large repository
— unacceptable for a tool whose entire budget is one laptop that is also running the model.

The consequence is that inferred types are invisible to the map: signatures are read from source
text, so an unannotated return type simply is not there. Accepted, because the type checker catches
exactly those cases in the verification loop, which is where they get fixed anyway.

React conventions are used as structural signal: `PascalCase` is labelled a component, `useX` a
hook. Cheap, and it lets a prompt say "these are the existing components" without a second pass.

## Consequences

- Zero native dependencies; `npm install` is the whole install
- Exact signatures for the stack that matters, and fast enough to run per invocation
- TypeScript and JavaScript only, until a second analyzer is added
- No cross-file type resolution in the map — deferred to the compiler in the verify loop
