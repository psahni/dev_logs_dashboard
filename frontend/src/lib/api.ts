import type { LogEntry } from "./types";

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
