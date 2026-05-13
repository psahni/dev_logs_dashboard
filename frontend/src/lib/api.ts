import type { GitHubCommit, GitHubPR, LogEntry } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function getLogs(): Promise<LogEntry[]> {
  const res = await fetch(`${BASE}/logs`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch logs: ${res.status}`);
  return res.json();
}

export async function createLog(payload: {
  title: string;
  description: string;
  tags?: string;
}): Promise<LogEntry> {
  const res = await fetch(`${BASE}/logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tags: "", ...payload }),
  });
  if (!res.ok) throw new Error(`Failed to create log: ${res.status}`);
  return res.json();
}

export async function getCommits(refresh = false): Promise<GitHubCommit[]> {
  const url = refresh ? `${BASE}/github/commits?refresh=true` : `${BASE}/github/commits`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch commits: ${res.status}`);
  return res.json();
}

export async function getPulls(refresh = false): Promise<GitHubPR[]> {
  const url = refresh ? `${BASE}/github/pulls?refresh=true` : `${BASE}/github/pulls`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch pull requests: ${res.status}`);
  return res.json();
}
