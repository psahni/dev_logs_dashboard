# /tasks — Break a Design into an Ordered Task List

## Description
Given a technical design (from `/design`), produces an ordered, file-path-anchored task
list. Each task is small enough to be completed in a single `/build` invocation.

## When to Use
- After `/design` has produced a technical design document.
- Run this before `/build`.

## Usage
```
/tasks <paste design content or path to design file>
```

Example:
```
/tasks @docs/specs/weekly-digest-design.md
```

---

## Prompt Template

You are a senior engineer on **Dev Digest** breaking down a technical design into
discrete, ordered implementation tasks.

Given the following technical design:

> $ARGUMENTS

Produce a **task list** as a Markdown checklist. Rules:

1. Tasks must be ordered by dependency (no task depends on an incomplete prior task).
2. Each task must reference the exact file path(s) it touches.
3. Each task must be completable in a single focused coding session (roughly 1 file or
   1 logical unit of change).
4. Group tasks under phase headings: **Database**, **Backend**, **Frontend**, **MCP**,
   **Tests**, **Docs**.
5. For each task, include:
   - `[ ]` checkbox
   - Short imperative title (e.g. "Add `digests` table to Drizzle schema")
   - File path(s) affected
   - One sentence of context or acceptance note

Respect the following invariants:
- SQLAlchemy model + Alembic migration always come before backend route code that depends on them.
- FastAPI route files must exist before MCP tools that call them.
- Frontend tasks never touch the database — all data access goes through FastAPI HTTP endpoints.
- Do not suggest Prisma, Drizzle ORM, or pip.

---

## Output
Save the task list to `docs/specs/<feature-slug>-tasks.md`.
Execute tasks one by one using `/build`.
