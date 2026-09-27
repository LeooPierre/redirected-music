<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Codex Instructions

## Efficiency

Optimize for correct task completion with minimal token and compute usage.

- Make the smallest change necessary to complete the task.
- Do not refactor, rewrite, or inspect unrelated code.
- Prefer existing project patterns and dependencies.
- Use tests, typecheckers, linters, and search instead of unnecessary broad exploration.
- Start with targeted tests/checks. Run broader suites only when necessary.
- Keep explanations and status updates concise.
- Do not produce long plans unless necessary.
- Avoid repeatedly reading files already understood.
- Avoid unnecessary web searches, subagents, or parallel exploration.
- Stop when the requested task is correctly completed and verified.

## Scope

Before expanding beyond the relevant files or subsystem, establish that doing so is necessary.
Do not make unrelated cleanup changes.

## Verification

After modifying code:

1. Run the smallest relevant test/typecheck/lint command.
2. Fix failures caused by the change.
3. Run broader verification only when warranted.

## Escalation

If the task appears to require substantially more reasoning or exploration than expected, tell me briefly before doing expensive additional exploration.
