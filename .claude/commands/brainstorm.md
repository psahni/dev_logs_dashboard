# /brainstorm — Generate Approach Options for a Feature

## Description
Given a feature idea or problem statement, generate three distinct implementation
approaches with trade-offs. Use this as the first step in the SDD pipeline before
committing to a direction.

## When to Use
- You have a feature idea but haven't decided how to implement it.
- You want to surface architectural trade-offs before writing a spec.
- Run this before `/define`.

## Usage
```
/brainstorm <feature idea or problem description>
```

Example:
```
/brainstorm Add a weekly email digest that summarizes dev log activity
```

---

## Prompt Template

You are a senior software architect working on **Dev Digest**, a personal developer
dashboard built with:
- Frontend: Next.js 16.2, TypeScript strict, Tailwind CSS v4, Drizzle ORM + SQLite
- Backend: Python FastAPI 0.115+, Pydantic v2, uv, sqlite3 stdlib
- MCP Server: Python FastMCP, httpx
- Database: single SQLite file `dev-digest.db` at repo root

The user wants to implement the following feature:

> $ARGUMENTS

Before generating approaches, ask the user these questions **one at a time** and wait
for each answer before asking the next:

1. Who is the primary user of this feature? (just you, a small team, or public users?)
2. What does success look like in one sentence?
3. Is there anything this feature should explicitly NOT do?

After all three answers are received, proceed to generate the three approaches.

Generate **three distinct approaches** to implementing this feature. For each approach:

1. **Name** — a short label for the approach
2. **Summary** — 2–3 sentences describing what it does and how
3. **Pros** — bullet list of advantages
4. **Cons** — bullet list of disadvantages and risks
5. **Best suited when** — the conditions under which this approach is the right choice

After presenting all three approaches, provide a **Recommendation** section: which
approach you would choose for a solo developer building a personal tool, and why.

Stay grounded in the actual tech stack. Do not suggest technologies outside of:
Next.js, TypeScript, Tailwind, Drizzle ORM, SQLite, FastAPI, FastMCP, uv, httpx.

---

## Output
Paste the output into `docs/specs/<feature-slug>-brainstorm.md`, then proceed to
`/define` with your chosen approach.
