# Gemini Project Folder

This folder stores supplemental Gemini-oriented guidance.

## Why This Exists

`GEMINI.md` at the repository root remains the canonical high-level instruction file.
This folder holds extended, task-focused guidance that can evolve without bloating root docs.

## Current Files

- `project-instructions.md`: Detailed project checklist and risk map.
- `testing.md`: Testing guidance and command workflow for Vitest.

## Best Practices

- Keep high-level rules in `GEMINI.md`.
- Keep detailed checklists and flow notes in this folder.
- Keep parity with `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/project-conventions.mdc`, and `.windsurf/rules/project-conventions.md` when changing core conventions.
- Do not create extra AI-tool folders unless the project starts actively using that tool.
- When feature behavior, env vars, integrations, or test workflows change, update the matching root documentation in the same branch.
