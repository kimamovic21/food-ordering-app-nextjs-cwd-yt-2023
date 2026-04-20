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
- Update rule files when auth, payment, email, or deployment behavior changes.
