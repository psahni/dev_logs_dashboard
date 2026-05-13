"use client";

import { useState } from "react";
import type { GitHubCommit, GitHubPR } from "@/lib/types";
import { getCommits, getPulls } from "@/lib/api";

type Props = {
  initialCommits: GitHubCommit[];
  initialPulls: GitHubPR[];
};

type ActivityItem =
  | { kind: "commit"; data: GitHubCommit }
  | { kind: "pr"; data: GitHubPR };

function CommitIcon() {
  return (
    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-500">
      C
    </span>
  );
}

function PRIcon({ state }: { state: string }) {
  const color = state === "open" ? "text-green-600 bg-green-50" : "text-purple-600 bg-purple-50";
  return (
    <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${color}`}>
      PR
    </span>
  );
}

function RepoBadge({ repo }: { repo: string }) {
  const short = repo.split("/").pop() ?? repo;
  return (
    <span className="font-accent rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500">
      {short}
    </span>
  );
}

function buildItems(commits: GitHubCommit[], pulls: GitHubPR[]): ActivityItem[] {
  const items: ActivityItem[] = [
    ...commits.map((c): ActivityItem => ({ kind: "commit", data: c })),
    ...pulls.map((p): ActivityItem => ({ kind: "pr", data: p })),
  ];
  return items.sort(
    (a, b) =>
      new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
  );
}

export default function GitHubActivityWidget({ initialCommits, initialPulls }: Props) {
  const [commits, setCommits] = useState<GitHubCommit[]>(initialCommits);
  const [pulls, setPulls] = useState<GitHubPR[]>(initialPulls);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRefresh() {
    setLoading(true);
    setError(null);
    try {
      const [freshCommits, freshPulls] = await Promise.all([
        getCommits(true),
        getPulls(true),
      ]);
      setCommits(freshCommits);
      setPulls(freshPulls);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh GitHub activity");
    } finally {
      setLoading(false);
    }
  }

  const items = buildItems(commits, pulls);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <h2 className="text-base font-semibold text-zinc-900">GitHub Activity</h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="font-accent rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mx-5 mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-10 text-sm text-zinc-400">
          Loading…
        </div>
      )}

      {!loading && items.length === 0 && (
        <p className="px-5 py-10 text-center text-sm text-zinc-400">
          No GitHub activity in the last 7 days.
        </p>
      )}

      {!loading && items.length > 0 && (
        <ul className="divide-y divide-zinc-100">
          {items.map((item) => {
            const date = new Date(item.data.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });

            if (item.kind === "commit") {
              const c = item.data;
              return (
                <li key={`commit-${c.sha}`} className="flex items-start gap-3 px-5 py-3">
                  <CommitIcon />
                  <div className="min-w-0 flex-1">
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm font-medium text-zinc-800 hover:text-indigo-600"
                    >
                      {c.message}
                    </a>
                    <div className="mt-1 flex items-center gap-2">
                      <RepoBadge repo={c.repo} />
                      <time className="font-accent text-xs text-zinc-400">{date}</time>
                    </div>
                  </div>
                </li>
              );
            }

            const p = item.data;
            return (
              <li key={`pr-${p.number}`} className="flex items-start gap-3 px-5 py-3">
                <PRIcon state={p.state} />
                <div className="min-w-0 flex-1">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-sm font-medium text-zinc-800 hover:text-indigo-600"
                  >
                    {p.title}
                  </a>
                  <div className="mt-1 flex items-center gap-2">
                    <RepoBadge repo={p.repo} />
                    <span className="text-xs text-zinc-400 capitalize">{p.state}</span>
                    <time className="font-accent text-xs text-zinc-400">{date}</time>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
