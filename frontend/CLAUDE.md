# frontend/CLAUDE.md — Next.js Frontend Conventions

See root [CLAUDE.md](../CLAUDE.md) for the full project overview.

---

## Framework

- Next.js 16.2, **App Router only** (no `pages/` directory)
- TypeScript in strict mode
- Tailwind CSS v4

The frontend has **zero database access**. It is a pure HTTP client — all data comes
from the FastAPI backend at `http://localhost:8000`.

---

## Directory Layout

```
frontend/
├── src/
│   ├── app/                   ← App Router: layouts, pages, loading, error files
│   │   ├── layout.tsx         ← root layout (includes Tailwind global styles)
│   │   ├── page.tsx           ← dashboard home
│   │   └── (features)/        ← route groups per feature
│   ├── components/
│   │   ├── ui/                ← primitive UI components (Button, Card, Input…)
│   │   └── features/          ← feature-specific composite components
│   └── lib/
│       ├── types.ts           ← TypeScript types mirroring FastAPI response schemas
│       ├── api.ts             ← fetch wrappers for FastAPI endpoints
│       └── utils.ts           ← shared utility functions
├── tailwind.config.ts
├── tsconfig.json              ← strict: true
├── package.json
└── next.config.ts
```

---

## Data Access

**The frontend never accesses the database directly.** There is no sqlite3, drizzle-orm,
better-sqlite3, or Prisma in this project's frontend.

- All data is fetched via HTTP from the FastAPI backend (`http://localhost:8000`).
- API helper functions live in `src/lib/api.ts`.
- TypeScript types for API responses live in `src/lib/types.ts` — these mirror the
  Pydantic response models defined in the backend.
- Base URL is read from `NEXT_PUBLIC_API_URL` env var, defaulting to `http://localhost:8000`.

```typescript
// src/lib/api.ts pattern
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export async function getLogs(): Promise<LogEntry[]> {
  const res = await fetch(`${BASE}/logs`)
  if (!res.ok) throw new Error('Failed to fetch logs')
  return res.json()
}
```

---

## Tailwind CSS Conventions

- Use Tailwind utility classes directly in JSX — no CSS modules, no styled-components.
- Design tokens (colors, spacing) defined in `tailwind.config.ts` under `theme.extend`.
- Dark mode: `class` strategy (toggled via `<html className="dark">`).
- Component variants: use `clsx` or `tailwind-merge` for conditional class composition.

---

## TypeScript Conventions

- `strict: true` in tsconfig — no implicit any, strict null checks.
- Prefer `type` over `interface` for object shapes unless declaration merging is needed.
- All server actions and API route handlers must have explicit return types.
- Use Zod for runtime validation of external data (API responses, form inputs).

---

## Component Conventions

- One component per file; filename matches the exported component name in PascalCase.
- **Server Components by default** — add `'use client'` only when browser APIs or hooks
  are needed.
- Props types defined inline above the component as `type Props = { ... }`.
- No default exports from barrel `index.ts` files — import directly from the file.

---

## Data Fetching — App Router Pattern

**Always fetch data in Server Components (page.tsx or layout.tsx), never in Client Components.**

The correct pattern:

```typescript
// app/some-route/page.tsx  ← Server Component, async
import { getSomeData } from "@/lib/api";
import SomeView from "@/components/views/SomeView";

export default async function SomePage() {
  const data = await getSomeData();          // runs on server, zero client JS
  return <SomeView data={data} />;           // passes pre-loaded data as props
}
```

```typescript
// components/views/SomeView.tsx  ← "use client" only if interactivity is needed
type Props = { data: SomeType[] };

export default function SomeView({ data }: Props) {
  // no useEffect, no useState for data — it arrived as props
}
```

**Rules:**
- Do NOT use `useEffect` + `setState` to fetch data — this is the pages-router anti-pattern.
- Do NOT call API helpers inside Client Components on mount.
- `"use client"` is only justified for: user interactions (onClick, onChange), browser APIs
  (localStorage, clipboard, Date for time-of-day), and React hooks (useState, useTransition).
- If a view needs both server-fetched data AND client interactivity, fetch in the page and
  pass data as props to a thin Client Component that handles only the interactive parts.

---

## What NOT To Do

- Do NOT import `sqlite3`, `drizzle-orm`, `better-sqlite3`, or any database library.
- Do NOT query the database directly — use `src/lib/api.ts` fetch helpers instead.
- Do NOT use the `pages/` router — App Router only.
- Do NOT use Prisma or any ORM in the frontend.

---

## Commands

```bash
npm run dev          # start dev server on http://localhost:3000
npm run build        # production build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
```
