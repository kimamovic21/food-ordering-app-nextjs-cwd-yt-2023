# Claude Project Folder

This folder contains supplemental Claude-oriented project guidance.

## Why This Exists

`CLAUDE.md` at the repository root is the main source of truth.
This folder is used for modular, reusable guidance that can be referenced during larger tasks.

## Current Files

- `project-instructions.md`: Practical coding and safety checklist for this codebase.
- `testing.md`: Testing priorities and workflow notes for Vitest usage.

## Best Practices

- Keep `CLAUDE.md` concise and stable.
- Put longer process checklists in this folder.
- Mirror important rule changes in `AGENTS.md`, `GEMINI.md`, `.cursor/rules/project-conventions.mdc`, and `.windsurf/rules/project-conventions.md` to keep parity across tools.
- Do not create extra AI-tool folders unless the project starts actively using that tool.
- When feature behavior, env vars, integrations, or test workflows change, update the matching root documentation in the same branch.
