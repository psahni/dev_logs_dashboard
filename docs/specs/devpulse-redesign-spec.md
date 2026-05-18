# Feature Spec — DevPulse Redesign

**Status:** Approved
**Feature slug:** `devpulse-redesign`
**Chosen approach:** Port HTML/CSS directly, adapt to React

---

## 1. Problem Statement

The current Dev Digest UI is a minimal two-column layout with no navigation, no unified feed, and no way to browse commits, PRs, or logs separately. The new DevPulse design introduces a professional editorial aesthetic — sidebar navigation, a chronological activity feed, per-surface pages, and a settings page — that better reflects the tool's growing feature set.

---

## 2. Functional Requirements

- The app **shall** be rebranded from "Dev Digest" to "DevPulse" throughout (title, headings, metadata).
- The app **shall** render a persistent left sidebar containing: brand mark, user profile block, navigation links grouped by section (Workspace, Surfaces, Generate, Account), dark mode toggle, and version badge.
- The app **shall** implement client-side navigation between screens without page reloads, using Next.js App Router with a shared layout.
- The **Home** screen **shall** display a greeting header (time-of-day + username), a subtitle showing total recent activity count, and a unified chronological feed mixing dev logs, GitHub commits, and GitHub PRs with type-coloured dot indicators.
- The **Activity Log** screen **shall** display only dev log entries in feed format with the "+ New Log" action.
- The **Commits** screen **shall** display GitHub commits in feed format with a search/filter bar.
- The **Pull Requests** screen **shall** display GitHub PRs grouped by status: Open, Drafts, Recently Merged.
- The **Standup** screen **shall** show the existing Groq-powered generator, enhanced with a two-pane layout: source selection (checkboxes for logs, PRs, commits) on the left, generated output on the right.
- The **Confluence Doc** screen **shall** show the same two-pane generator pattern.
- The **Settings** screen **shall** display integration cards for GitHub, Groq, Slack, and Confluence showing connected/disconnected status; Slack and Confluence cards **shall** show "Not connected" and a "Connect" button (no live wiring in v1).
- The app **shall** support a dark mode toggle in the sidebar footer that persists via `localStorage`.
- The design **shall** use the three-font system from the reference: Instrument Serif (display/headings), Geist (UI body), JetBrains Mono (meta/mono).
- The color system **shall** use CSS custom properties matching the reference (`--paper`, `--ink`, `--red`, `--green`, `--violet`, etc.) with full dark mode variants.

---

## 3. Non-Functional Requirements

- **Cleanliness:** One component per screen, one component per reusable UI element. No component file longer than ~150 lines.
- **No backend changes:** All data continues to flow from the existing FastAPI endpoints. Zero changes to `backend/`.
- **Performance:** Font loading via `next/font/google` with `display: swap`. No layout shift on navigation.
- **Accessibility:** Navigation links are real `<a>` or Next.js `<Link>` elements. Dark mode uses `data-theme` attribute on `<html>`.

---

## 4. Constraints

- Frontend only — `backend/` and `mcp-server/` are untouched.
- Next.js App Router — no `pages/` directory. Sidebar lives in `app/layout.tsx`.
- Tailwind CSS v4 — CSS custom properties defined in `globals.css` via `@theme inline`; utility classes for layout/spacing; global CSS layer for design-token-dependent styles (feed items, chips, generator panels).
- Existing API helpers (`lib/api.ts`) and TypeScript types (`lib/types.ts`) are reused unchanged.
- No new npm packages — Geist and JetBrains Mono are already installed; add Instrument Serif via `next/font/google`.

---

## 5. Out of Scope

- Slack API integration (settings card shows UI only)
- Confluence API integration (settings card shows UI only)
- Jira integration
- Backend or database changes
- Authentication or multi-user support
- Real-time feed updates (polling, websockets)
- PR/commit pagination beyond what the GitHub cache already provides

---

## 6. Acceptance Criteria

1. The browser tab title reads "DevPulse".
2. The sidebar renders on all screens with correct active state highlighting the current route.
3. Clicking sidebar links navigates between screens without a full page reload.
4. The Home feed shows dev logs, commits, and PRs mixed and sorted by date descending.
5. The Activity Log screen shows only dev log entries.
6. The Commits screen shows only GitHub commits.
7. The Pull Requests screen groups PRs under Open, Drafts, and Merged headings.
8. The Standup and Confluence screens each show a two-pane generator layout.
9. The Settings screen shows four integration cards; GitHub and Groq show "Connected"; Slack and Confluence show "Not connected".
10. The dark mode toggle switches the visual theme and the preference survives a page refresh.
11. Instrument Serif is used for large display headings (`page-title`, `section-title`, generator titles).
12. No inline styles remain in component files — all styling via Tailwind utilities or CSS custom properties.
13. `backend/` has zero changed files.

---

## 7. Refactoring Notes

The following existing components are **replaced** (not extended):

| Old file | Replacement |
|---|---|
| `LogDashboard.tsx` | `AppShell.tsx` (layout) + `HomeView.tsx` |
| `LogList.tsx` + `LogCard.tsx` | `FeedItem.tsx` (unified, type-aware) |
| `GitHubActivityWidget.tsx` | `CommitsView.tsx` + `PullRequestsView.tsx` + feed items in `HomeView.tsx` |
| `GeneratePanel.tsx` | `StandupView.tsx` + `ConfluenceView.tsx` (two-pane each) |
| `NewLogModal.tsx` | Keep — reused from `ActivityLogView.tsx` |
| `TagChip.tsx` | Replace with `Chip.tsx` (supports colour variants: green, violet, amber) |
