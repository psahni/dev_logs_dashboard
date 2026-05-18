# Task List — DevPulse Redesign

**Design:** `docs/specs/devpulse-redesign-design.md`
**Spec:** `docs/specs/devpulse-redesign-spec.md`

---

## Phase 1 — CSS Foundation

- [x] **Task 1: Overhaul `globals.css` with DevPulse design tokens**
  - File: `frontend/src/app/globals.css`
  - Replace current `@theme inline` block and add CSS custom properties for `--paper`, `--ink`, `--border`, `--red`, `--green`, `--violet`, `--amber` (light + dark mode), app-shell layout primitives, feed-item and chip CSS classes.

- [x] **Task 2: Update fonts in `layout.tsx`**
  - File: `frontend/src/app/layout.tsx`
  - Replace Roboto/Lora/Roboto Mono with Instrument Serif + JetBrains Mono (Geist already installed). Update `@theme inline` font mappings. Update metadata title to "DevPulse".

---

## Phase 2 — Layout Shell

- [x] **Task 3: Create `ThemeProvider`**
  - File: `frontend/src/components/providers/ThemeProvider.tsx`
  - Client Component. Reads/writes `localStorage` key `devpulse-theme`. Sets `data-theme` on `document.documentElement`. Exposes `ThemeContext` with `{ theme, toggleTheme }` and a `useTheme()` hook.

- [x] **Task 4: Create `Sidebar`**
  - File: `frontend/src/components/layout/Sidebar.tsx`
  - Client Component. Fixed-left sidebar (260px). Brand mark "DevPulse", nav groups (Workspace: Home, Activity Log; Surfaces: Commits, Pull Requests; Generate: Standup, Confluence; Account: Settings), active link highlight via `usePathname()`, dark mode toggle via `useTheme()`, version badge in footer.

- [x] **Task 5: Update root layout to use ThemeProvider + Sidebar**
  - File: `frontend/src/app/layout.tsx`
  - Wrap `children` in `<ThemeProvider>`. Add app-shell div with `<Sidebar />` + `<main>` content area. Remove old `min-h-full flex flex-col` body pattern.

---

## Phase 3 — Shared UI Components

- [x] **Task 6: Create `Chip` component**
  - File: `frontend/src/components/ui/Chip.tsx`
  - Replaces `TagChip.tsx`. Accepts `label` and `variant: "green" | "violet" | "amber"` (default `"violet"`). Uses CSS classes `chip chip-{variant}` from `globals.css`.

- [x] **Task 7: Create `FeedItem` component**
  - File: `frontend/src/components/ui/FeedItem.tsx`
  - Accepts `FeedItemData` (type, title, date, repo?, url?, tags?, status?). Renders coloured dot indicator, title (link if `url`), date + repo meta, Chip tags for log entries, status chip for PRs.

---

## Phase 4 — Screen Views

- [x] **Task 8: Create `HomeView`**
  - File: `frontend/src/components/views/HomeView.tsx`
  - Client Component. Fetches `getLogs()`, `getCommits()`, `getPulls()` on mount. Merges into unified `FeedItemData[]`, sorts by date desc. Renders greeting header (time-of-day + "Prashant"), activity count subtitle, feed list of `FeedItem` components.

- [x] **Task 9: Update home page route**
  - File: `frontend/src/app/page.tsx`
  - Replace current `LogDashboard` render with `<HomeView />`.

- [x] **Task 10: Create `ActivityLogView`**
  - File: `frontend/src/components/views/ActivityLogView.tsx`
  - Client Component. Fetches `getLogs()`. Renders "+ New Log" button, feed of `FeedItem` (type="log"), `NewLogModal` on button press. On modal success, prepends new entry to local state.

- [x] **Task 11: Add `/activity` route**
  - File: `frontend/src/app/activity/page.tsx`
  - Server page component that renders `<ActivityLogView />`.

- [x] **Task 12: Create `CommitsView`**
  - File: `frontend/src/components/views/CommitsView.tsx`
  - Client Component. Fetches `getCommits()`. State: `searchQuery`. Filters commits by message/repo match. Renders search input + list of `FeedItem` (type="commit").

- [x] **Task 13: Add `/commits` route**
  - File: `frontend/src/app/commits/page.tsx`
  - Server page component that renders `<CommitsView />`.

- [x] **Task 14: Create `PullRequestsView`**
  - File: `frontend/src/components/views/PullRequestsView.tsx`
  - Client Component. Fetches `getPulls()`. Groups into open / draft (empty-state handled) / merged. Renders each group with a section heading and `FeedItem` list.

- [x] **Task 15: Add `/pulls` route**
  - File: `frontend/src/app/pulls/page.tsx`
  - Server page component that renders `<PullRequestsView />`.

- [x] **Task 16: Create `StandupView`**
  - File: `frontend/src/components/views/StandupView.tsx`
  - Client Component. Two-pane layout: left has source checkboxes (Dev Logs, Commits, PRs — UI only, all selected by default), right shows output `<pre>` or placeholder. Uses `useTransition` for loading state. Calls `generateStandup()`. Copy button via clipboard API.

- [x] **Task 17: Add `/standup` route**
  - File: `frontend/src/app/standup/page.tsx`
  - Server page component that renders `<StandupView />`.

- [x] **Task 18: Create `ConfluenceView`**
  - File: `frontend/src/components/views/ConfluenceView.tsx`
  - Client Component. Same two-pane pattern as `StandupView`. Calls `generateConfluence()`.

- [x] **Task 19: Add `/confluence` route**
  - File: `frontend/src/app/confluence/page.tsx`
  - Server page component that renders `<ConfluenceView />`.

- [x] **Task 20: Create `SettingsView`**
  - File: `frontend/src/components/views/SettingsView.tsx`
  - Server Component. Four static integration cards. GitHub: "Connected" (green chip). Groq: "Connected" (green chip). Slack: "Not connected" + "Connect" button (disabled/UI only). Confluence: "Not connected" + "Connect" button (disabled/UI only).

- [x] **Task 21: Add `/settings` route**
  - File: `frontend/src/app/settings/page.tsx`
  - Server page component that renders `<SettingsView />`.

---

## Phase 5 — Cleanup

- [x] **Task 22: Delete replaced components**
  - Delete: `frontend/src/components/features/LogDashboard.tsx`
  - Delete: `frontend/src/components/features/LogList.tsx`
  - Delete: `frontend/src/components/features/LogCard.tsx`
  - Delete: `frontend/src/components/features/GitHubActivityWidget.tsx`
  - Delete: `frontend/src/components/features/GeneratePanel.tsx`
  - Delete: `frontend/src/components/ui/TagChip.tsx`
  - Verify no import errors remain with `npm run type-check`.

---

## Summary

| Phase | Tasks | Files touched |
|---|---|---|
| CSS Foundation | 1–2 | `globals.css`, `layout.tsx` |
| Layout Shell | 3–5 | `ThemeProvider.tsx`, `Sidebar.tsx`, `layout.tsx` |
| Shared UI | 6–7 | `Chip.tsx`, `FeedItem.tsx` |
| Screen Views | 8–21 | 7 view components + 7 route pages |
| Cleanup | 22 | 6 deleted files |
