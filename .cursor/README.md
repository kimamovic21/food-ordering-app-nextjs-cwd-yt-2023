# Cursor Project Configuration

This folder stores Cursor-specific project rules.

## Recommended Structure

- `rules/*.mdc`: Auto-applied rules used by Cursor while generating or editing code.

## Current Files

- `rules/project-conventions.mdc`: Global conventions and safety rules for this repository.

## Best Practices

- Keep rule files short and actionable.
- Separate global rules from feature-specific rules.
- Prefer one source of truth for stack and security requirements:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `GEMINI.md`
- Update rule files when auth, payment, email, courier/order, deployment, env, test workflow, or documentation-process behavior changes.
- Keep `.windsurf/rules/project-conventions.md`, `.claude/project-instructions.md`, and `.gemini/project-instructions.md` aligned with workflow-critical Cursor rules.
- Do not add extra AI-tool config folders unless the project actively uses that tool.
