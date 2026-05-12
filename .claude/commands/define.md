# /define — Write a Structured Feature Spec

## Description
Turns a chosen approach (from `/brainstorm`) into a formal spec with problem statement,
requirements, constraints, and acceptance criteria. This is the artifact that drives
all downstream design and task creation.

## When to Use
- After running `/brainstorm` and picking an approach.
- Run this before `/design`.

## Usage
```
/define <chosen approach summary or paste brainstorm output>
```

Example:
```
/define Use a scheduled FastAPI background task that queries recent log entries and
formats them into a Markdown digest, stored back to SQLite via a digests table.
```

---

## Prompt Template

You are a technical product manager working on **Dev Digest**, a personal developer
dashboard.

The developer has chosen the following approach to implement:

> $ARGUMENTS

Write a **structured feature spec** with the following sections:

### 1. Problem Statement
What problem does this feature solve? Why does it matter for a personal dev dashboard?

### 2. Functional Requirements
Bulleted list of what the feature must do (use "shall" language).

### 3. Non-Functional Requirements
Performance, security, reliability, or usability constraints relevant to a solo
developer context.

### 4. Constraints
Technical boundaries:
- Must use Drizzle ORM for all frontend database access (no Prisma, no raw SQL in app code)
- Backend uses Python FastAPI + uv; no SQLAlchemy
- MCP server uses FastMCP and communicates with backend via HTTP only
- Single SQLite file at repo root (`dev-digest.db`)
- `backend/` and `mcp-server/` are independent Python projects

### 5. Out of Scope
What this feature explicitly will not do (at least in v1).

### 6. Acceptance Criteria
A numbered checklist. Each item is testable and binary (pass/fail).

### 7. Open Questions
Any unknowns that need resolution before implementation.

---

## Output
Save the spec to `docs/specs/<feature-slug>-spec.md`.
Then run `/design` with this spec.
