# Brainstorm — DevPulse Redesign

**Feature slug:** `devpulse-redesign`
**Status:** Approach 3 chosen

---

## Context

Replace the current flat dashboard layout with the new DevPulse design: editorial serif typography, sidebar navigation, unified activity feed, per-surface pages (commits, PRs, logs), generator pages for standup and Confluence doc, and a settings page with integration cards. Rebranding from "Dev Digest" to "DevPulse".

---

## Clarifying Questions & Answers

**1. Rebranding?**
DevPulse — rename throughout.

**2. What does success look like?**
The app matches the new design as closely as possible, with new features/enhancements implemented and clean, easily comprehensible components.

**3. What should it NOT do?**
- Do not implement new integrations (Slack, Confluence API) — just document the design/approach for later
- Keep components very clean and readable
- Generate refactoring spec and tasks where needed

---

## Approach 1 — Full Rewrite

**Summary**
Tear down all existing components and rebuild every screen from scratch to match the DevPulse design. Port the CSS custom property system into Tailwind v4 `@theme` tokens. All new routes created fresh.

**Pros**
- Clean slate — no legacy code mixed with new design
- Perfect 1:1 match with the provided HTML/CSS
- No risk of old styles leaking into new components

**Cons**
- High effort — every working component needs to be rebuilt
- Risk of regressions in features that already work (log creation, GitHub fetch, AI generation)
- Longer time to a working state

**Best suited when**
The existing codebase is a throwaway prototype with minimal working logic.

---

## Approach 2 — Incremental Migration

**Summary**
Implement the new design system first (tokens, layout shell, sidebar), then migrate screens one at a time — each PR leaves the app in a working state. Old components are deprecated and removed as their replacements land.

**Pros**
- Always shippable — each step is a working increment
- Lower regression risk — existing logic is only touched when its screen is migrated
- Easier to review in small PRs

**Cons**
- Temporary visual inconsistency while migration is in progress
- Requires careful sequencing (layout must land before screens)
- More total coordination effort

**Best suited when**
You're shipping to users and can't afford a broken state during migration.

---

## Approach 3 — Port HTML/CSS Directly, Adapt to React ✅ CHOSEN

**Summary**
Convert the provided `styles.css` into Tailwind v4 `@theme` tokens plus a global CSS layer, then map each HTML section in `DevPulse-static.html` directly to a clean React component — one component per screen, one file per component. Existing data-fetching logic (API calls, types) is reused unchanged; only the presentation layer is replaced.

**Pros**
- Fastest path to visual parity — the design is already written, just needs JSX translation
- Existing backend/API/types are untouched — only `frontend/src/` presentation changes
- Each screen maps 1:1 to a component, keeping files small and focused
- CSS variables from the reference design drop straight into `globals.css`

**Cons**
- Requires careful reading of the HTML to produce idiomatic React (not just copy-paste)
- Some CSS needs adaptation for Tailwind v4 (custom properties vs utility classes)

**Best suited when**
You have a pixel-perfect reference design in HTML/CSS and want to match it faithfully without inventing structure.

---

## New Screens / Features in the Design

| Screen | Status | Notes |
|---|---|---|
| Sidebar navigation | New | Hash-based routing, dark mode toggle, profile block |
| Home feed | Refactor | Merged log + commit + PR feed, sorted chronologically |
| Activity log page | New | Dev logs only, separate from home |
| Commits page | New | GitHub commits with filter bar |
| Pull requests page | New | PRs grouped by Open / Drafts / Merged |
| Standup generator | Refactor | Source selection checkboxes + two-pane output |
| Confluence generator | Refactor | Same two-pane pattern |
| Settings page | New (UI only) | Integration cards for GitHub, Groq, Slack, Confluence; no live API wiring |
| Dark mode | New | CSS data-theme toggle, persisted via localStorage |

## Out of Scope (for this task)

- Slack integration (card shown, not wired)
- Confluence API integration (card shown, not wired)
- Jira integration (not shown in design)
- Backend changes (zero backend work needed)
