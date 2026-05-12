# Skill: standup-generator

## Description
Reads recent git commits and/or dev log entries and generates a concise async standup
summary in the standard Yesterday / Today / Blockers format. Useful for daily standups,
async status posts, or end-of-day notes.

## Input Variables

| Variable       | Description                                                        |
|----------------|--------------------------------------------------------------------|
| `$COMMITS`     | Output of `git log --oneline -20` or similar (paste as text)      |
| `$LOG_ENTRIES` | Optional: manual dev log notes from today or yesterday             |
| `$DATE`        | Today's date (ISO format, e.g. 2026-05-12)                        |
| `$AUTHOR`      | Your name or handle                                                |

## Prompt Template

You are generating a daily standup summary for a software engineer.

Date: $DATE
Author: $AUTHOR

Recent git commits:
---
$COMMITS
---

Additional dev log notes (if any):
---
$LOG_ENTRIES
---

Write a **standup summary** in this exact format:

**Yesterday**
- [bullet per completed task inferred from commits/logs — max 4]

**Today**
- [bullet per in-progress or next planned task — infer from commit patterns and log notes — max 3]

**Blockers**
- [bullet per blocker, or "None" if none are evident]

Rules:
- Each bullet is one line, starting with a verb in past tense (Yesterday) or
  present/future tense (Today).
- Reference specific files, components, or features by name where possible.
- Do not pad with vague bullets. If there is no evidence for a bullet, omit it.
- Total length: under 150 words.

## Example Usage

```bash
git log --oneline -20
```

Paste the output as `$COMMITS`. Add any manual notes as `$LOG_ENTRIES`.

Example output:
```
**Yesterday**
- Added `digests` table to Drizzle schema and ran migration
- Implemented `GET /digests` endpoint in `backend/app/routes/digests.py`

**Today**
- Wire DigestList component to fetch from `/digests` API
- Write unit tests for digest route

**Blockers**
- None
```
