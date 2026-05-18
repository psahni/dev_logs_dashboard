# Technical Design — DevPulse Redesign

**Spec:** `docs/specs/devpulse-redesign-spec.md`
**Approach:** Port HTML/CSS directly, adapt to React

---

## 1. Layout Architecture

### App Router Route Tree

```
frontend/src/app/
├── layout.tsx            ← root layout: fonts, ThemeProvider, Sidebar, <main>
├── globals.css           ← design tokens (@theme + CSS custom properties)
├── page.tsx              ← / → HomeView
├── activity/
│   └── page.tsx          ← /activity → ActivityLogView
├── commits/
│   └── page.tsx          ← /commits → CommitsView
├── pulls/
│   └── page.tsx          ← /pulls → PullRequestsView
├── standup/
│   └── page.tsx          ← /standup → StandupView
├── confluence/
│   └── page.tsx          ← /confluence → ConfluenceView
└── settings/
    └── page.tsx          ← /settings → SettingsView
```

### Root Layout Structure (`layout.tsx`)

```
<html data-theme="light" lang="en" [font variables]>
  <body>
    <ThemeProvider>          ← Client Component: manages data-theme + localStorage
      <div class="app-shell">
        <Sidebar />          ← Client Component (needs usePathname for active state)
        <main class="main-content">
          {children}
        </main>
      </div>
    </ThemeProvider>
  </body>
</html>
```

`ThemeProvider` is a thin client wrapper that reads `localStorage` on mount and sets
`document.documentElement.setAttribute('data-theme', ...)`. It exposes a context with
`theme` + `toggleTheme` consumed by `Sidebar`.

---

## 2. CSS System

### `globals.css` Overhaul

Replace the current Roboto/Lora/Roboto Mono token block with:

```css
/* 1 — font variables (from next/font/google) */
@theme inline {
  --font-display: var(--font-instrument-serif);
  --font-ui: var(--font-geist);
  --font-mono: var(--font-jetbrains-mono);
}

/* 2 — design tokens (light mode defaults) */
:root {
  --paper: #faf9f6;
  --paper-2: #f0ede6;
  --ink: #1a1917;
  --ink-2: #6b6860;
  --ink-3: #9c9a94;
  --border: #e4e0d8;
  --red: #c0392b;
  --red-bg: #fdf2f0;
  --green: #1a6b3c;
  --green-bg: #f0faf4;
  --violet: #5b3fa6;
  --violet-bg: #f3f0fa;
  --amber: #a05c00;
  --amber-bg: #fdf6e8;
  --sidebar-w: 260px;
}

/* 3 — dark mode */
[data-theme="dark"] {
  --paper: #121110;
  --paper-2: #1e1c1a;
  --ink: #f0ede6;
  --ink-2: #9c9a94;
  --ink-3: #6b6860;
  --border: #2a2825;
  --red-bg: #2a1510;
  --green-bg: #0f2018;
  --violet-bg: #1a1428;
  --amber-bg: #251a08;
}

/* 4 — base element styles */
body {
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-geist), system-ui, sans-serif;
}

/* 5 — layout primitives */
.app-shell { display: flex; min-height: 100vh; }
.main-content { flex: 1; margin-left: var(--sidebar-w); padding: 2rem 2.5rem; }

/* 6 — feed item styles (design-token-dependent) */
.feed-item { ... }
.feed-dot-log { background: var(--violet); }
.feed-dot-commit { background: var(--green); }
.feed-dot-pr { background: var(--amber); }

/* 7 — chip variants */
.chip { ... }
.chip-green { background: var(--green-bg); color: var(--green); }
.chip-violet { background: var(--violet-bg); color: var(--violet); }
.chip-amber { background: var(--amber-bg); color: var(--amber); }
```

### Font Changes in `layout.tsx`

Replace the four-font import with:

```typescript
import { Instrument_Serif } from "next/font/google";
import { GeistSans } from "geist/font/sans";        // already installed
import { JetBrains_Mono } from "next/font/google";  // already installed
```

Geist is already a project dependency. Only `Instrument_Serif` is new (no new npm
package needed — loaded via `next/font/google`).

---

## 3. Component Breakdown

### New Components

| File | Type | Purpose |
|---|---|---|
| `components/providers/ThemeProvider.tsx` | Client | Reads/writes `localStorage`, sets `data-theme` on `<html>`, exposes `useTheme()` |
| `components/layout/Sidebar.tsx` | Client | Sidebar shell: brand, nav groups, profile, dark toggle, version badge |
| `components/ui/Chip.tsx` | Server | Tag chip with `green \| violet \| amber` colour variants |
| `components/ui/FeedItem.tsx` | Server | Single feed row: dot indicator, title, meta (date, repo), chip tags |
| `components/views/HomeView.tsx` | Client | Greeting header, unified chronological feed |
| `components/views/ActivityLogView.tsx` | Client | Dev logs feed + "+ New Log" button + NewLogModal |
| `components/views/CommitsView.tsx` | Client | GitHub commits list with search filter |
| `components/views/PullRequestsView.tsx` | Client | PRs grouped by Open / Drafts / Merged |
| `components/views/StandupView.tsx` | Client | Two-pane: source checkboxes left, generated output right |
| `components/views/ConfluenceView.tsx` | Client | Same two-pane pattern as StandupView |
| `components/views/SettingsView.tsx` | Server | Four integration cards (GitHub ✓, Groq ✓, Slack ✗, Confluence ✗) |

### Components Kept Unchanged

| File | Notes |
|---|---|
| `components/features/NewLogModal.tsx` | Reused inside `ActivityLogView` — no changes |
| `lib/api.ts` | All fetch helpers unchanged |
| `lib/types.ts` | All types unchanged |

### Components Replaced (delete after redesign)

| Old file | Replaced by |
|---|---|
| `components/features/LogDashboard.tsx` | `layout.tsx` (shell) + `HomeView.tsx` |
| `components/features/LogList.tsx` | `ActivityLogView.tsx` |
| `components/features/LogCard.tsx` | `FeedItem.tsx` |
| `components/features/GitHubActivityWidget.tsx` | `CommitsView.tsx` + `PullRequestsView.tsx` |
| `components/features/GeneratePanel.tsx` | `StandupView.tsx` + `ConfluenceView.tsx` |
| `components/ui/TagChip.tsx` | `Chip.tsx` |

---

## 4. Component Props

### `ThemeProvider`

```typescript
type Props = { children: React.ReactNode };
// exposes: ThemeContext with { theme: "light" | "dark"; toggleTheme: () => void }
// export: useTheme() hook
```

### `Sidebar`

```typescript
// No props — reads active route via usePathname(), theme via useTheme()
// Nav items: Home (/), Activity Log (/activity), Commits (/commits),
//            Pull Requests (/pulls), Standup (/standup), Confluence (/confluence),
//            Settings (/settings)
```

### `Chip`

```typescript
type Props = { label: string; variant?: "green" | "violet" | "amber" };
// default variant: "violet"
```

### `FeedItem`

```typescript
type FeedItemData = {
  type: "log" | "commit" | "pr";
  title: string;
  date: string;
  repo?: string;
  url?: string;
  tags?: string[];   // for log entries
  status?: "open" | "merged" | "draft";  // for PRs
};
type Props = { item: FeedItemData };
```

### `HomeView`

```typescript
// Client Component — fetches getLogs(), getCommits(), getPulls() on mount
// Merges into FeedItemData[], sorts by date desc
// Shows greeting: "Good morning, Prashant" (time-of-day computed client-side)
// Shows subtitle: "{n} updates in the last 7 days"
```

### `ActivityLogView`

```typescript
// Client Component — fetches getLogs() on mount
// State: logs[], showModal (boolean)
// Renders: "+ New Log" button, list of FeedItem (type="log"), NewLogModal when open
// On modal success: prepend new log to local state
```

### `CommitsView`

```typescript
// Client Component — fetches getCommits() on mount
// State: commits[], searchQuery
// Renders: search input, filtered list of FeedItem (type="commit")
// Search filters on title (commit message) and repo
```

### `PullRequestsView`

```typescript
// Client Component — fetches getPulls() on mount
// Groups: open (state="open"), drafts (state="draft" — none currently, show empty state),
//         merged (state="merged")
// Renders each group with a section heading + FeedItem list
```

### `StandupView` / `ConfluenceView`

```typescript
// Client Component — two-pane layout
// Left pane: source checkboxes (Dev Logs, GitHub Commits, GitHub PRs)
// Right pane: generated output (<pre>) or placeholder
// State: isPending (useTransition), output, error
// Generate button calls generateStandup() / generateConfluence()
// Copy button: navigator.clipboard.writeText()
```

### `SettingsView`

```typescript
// Server Component — static cards, no interactivity needed
// Cards: GitHub (connected), Groq (connected), Slack (not connected), Confluence (not connected)
```

---

## 5. Integration Points

```
layout.tsx
  └─ ThemeProvider (client)
       └─ Sidebar (client) ← usePathname, useTheme
       └─ page.tsx → HomeView (client) ← getLogs(), getCommits(), getPulls()
       └─ activity/page.tsx → ActivityLogView (client) ← getLogs(), createLog()
       └─ commits/page.tsx → CommitsView (client) ← getCommits()
       └─ pulls/page.tsx → PullRequestsView (client) ← getPulls()
       └─ standup/page.tsx → StandupView (client) ← generateStandup()
       └─ confluence/page.tsx → ConfluenceView (client) ← generateConfluence()
       └─ settings/page.tsx → SettingsView (server) ← static
```

All API calls use existing helpers in `lib/api.ts`. No new endpoints are needed.

---

## 6. Dark Mode Implementation

`ThemeProvider` client component:

1. On mount: reads `localStorage.getItem("devpulse-theme")` → defaults to `"light"`.
2. Sets `document.documentElement.setAttribute("data-theme", theme)`.
3. `toggleTheme()` flips the value, writes to `localStorage`, updates the attribute.
4. SSR safety: `<html data-theme="light">` is the server-rendered default; no flash
   because ThemeProvider hydrates synchronously on first paint.

---

## 7. Migration Plan

No backend, database, or API changes. This is a pure frontend presentation layer swap.

Implementation order (each step leaves the app in a working state):

1. **CSS foundation** — overhaul `globals.css`, update fonts in `layout.tsx`
2. **ThemeProvider + Sidebar** — add providers, sidebar, update root layout
3. **FeedItem + Chip** — new shared UI components
4. **HomeView** — unified feed on `/`
5. **ActivityLogView** — logs-only feed on `/activity`
6. **CommitsView** — commits on `/commits`
7. **PullRequestsView** — PRs on `/pulls`
8. **StandupView** — generator on `/standup`
9. **ConfluenceView** — generator on `/confluence`
10. **SettingsView** — static cards on `/settings`
11. **Cleanup** — delete replaced components, verify no broken imports
