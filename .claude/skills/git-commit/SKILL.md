# Skill: git-commit

## Description
Generates a conventional commit message from staged changes. Follows the
Conventional Commits 1.0.0 specification. Includes scope, body, and breaking-change
footer where appropriate. Never adds fluff or redundant context.

## Input Variables

| Variable   | Description                                               |
|------------|-----------------------------------------------------------|
| `$DIFF`    | Output of `git diff --staged` (paste as text)            |
| `$CONTEXT` | Optional: extra context about the change's intent        |

## Prompt Template

You are generating a git commit message following the **Conventional Commits 1.0.0**
specification.

Staged diff:
---
$DIFF
---

Extra context (if any): $CONTEXT

Generate a **commit message** that:

1. Has a subject line: `<type>(<scope>): <short description>`
   - `type`: one of `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`
   - `scope`: the affected module or file area (e.g. `schema`, `logs-route`,
     `newsletter-skill`, `drizzle-config`)
   - `short description`: imperative, lowercase, no period, max 72 chars total subject
2. Has a blank line after the subject.
3. Has a body (if the change is non-trivial): explains WHY, not WHAT. Max 3 sentences.
   The diff already shows what changed.
4. Has a footer with `BREAKING CHANGE:` if any public API or schema is changed in a
   backward-incompatible way.

Do not include:
- Filler phrases ("This commit...", "Updated to...", "Changed X to Y")
- More than one subject line

Output only the raw commit message text, nothing else.

## Example Usage

```bash
git diff --staged
```

Paste the output as `$DIFF`. Optionally describe the intent as `$CONTEXT`.

Example output:
```
feat(schema): add digests table with weekOf and content columns

Needed to persist generated weekly digests so they can be retrieved
without re-generating from raw log entries on every request.
```
