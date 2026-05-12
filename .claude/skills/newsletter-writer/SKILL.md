# Skill: newsletter-writer

## Description
Synthesizes a collection of dev log entries into a polished, newsletter-style weekly
update. Suitable for sharing in a personal blog, a team Slack, or an email digest.
Highlights what was built, what was learned, and what comes next — not a raw task list.

## Input Variables

| Variable        | Description                                                       |
|-----------------|-------------------------------------------------------------------|
| `$LOG_ENTRIES`  | Raw dev log entries for the week (paste text, JSON, or markdown)  |
| `$WEEK_OF`      | ISO date of the week start (e.g. 2026-05-11)                     |
| `$AUTHOR`       | Your name or handle                                               |
| `$PROJECT_NAME` | Name of the project(s) worked on this week                        |

## Prompt Template

You are a developer advocate writing a weekly newsletter update on behalf of a software
engineer.

Author: $AUTHOR
Week of: $WEEK_OF
Project(s): $PROJECT_NAME

Dev log entries for the week:
---
$LOG_ENTRIES
---

Write a **weekly developer newsletter update** with the following structure:

### This Week in Dev — $WEEK_OF

**What I Shipped**
3–5 bullet points. Each bullet names a concrete deliverable (feature, fix, refactor,
doc). Use past tense. Be specific — include component names, route names, or table names
where relevant.

**What I Learned**
2–3 bullets. Each describes a technical insight, a mistake corrected, or a concept
deepened this week.

**Interesting Problems**
One short paragraph (3–5 sentences) describing the most interesting technical challenge
encountered this week: what it was, why it was hard, and how it was resolved.

**Next Week**
2–3 bullets. What's queued up for next week.

Tone: conversational, first-person, direct. No filler phrases ("exciting", "thrilled",
"in today's fast-paced world"). Under 400 words total.

## Example Usage

Fill in the variables and invoke the skill:

```
Author: Prashant
Week of: 2026-05-11
Project(s): Dev Digest
Log entries:
- Built the /logs POST endpoint in FastAPI
- Added digests table to Drizzle schema
- Fixed a sqlite3.Row serialization bug in the logs route
- Wrote standup-generator skill template
```
