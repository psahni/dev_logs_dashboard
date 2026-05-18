"use client";

import { useEffect, useState } from "react";
import { getLogs, getCommits, getPulls } from "@/lib/api";
import type { LogEntry, GitHubCommit, GitHubPR } from "@/lib/types";
import FeedItem, { type FeedItemData } from "@/components/ui/FeedItem";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function logsToFeed(logs: LogEntry[]): FeedItemData[] {
  return logs.map((l) => ({
    type: "log" as const,
    title: l.title,
    date: l.created_at,
    tags: l.tags ? l.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
  }));
}

function commitsToFeed(commits: GitHubCommit[]): FeedItemData[] {
  return commits.map((c) => ({
    type: "commit" as const,
    title: c.message,
    date: c.date,
    repo: c.repo,
    url: c.url,
  }));
}

function pullsToFeed(pulls: GitHubPR[]): FeedItemData[] {
  return pulls.map((p) => ({
    type: "pr" as const,
    title: p.title,
    date: p.date,
    repo: p.repo,
    url: p.url,
    status: p.state,
  }));
}

export default function HomeView() {
  const [feed, setFeed] = useState<FeedItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [logs, commits, pulls] = await Promise.all([
          getLogs(),
          getCommits(),
          getPulls(),
        ]);
        const merged = [
          ...logsToFeed(logs),
          ...commitsToFeed(commits),
          ...pullsToFeed(pulls),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setFeed(merged);
      } catch {
        setError("Failed to load activity. Is the backend running?");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{getGreeting()}, Prashant</h1>
        {!loading && !error && (
          <p className="page-subtitle">
            {feed.length} update{feed.length !== 1 ? "s" : ""} across your workspace
          </p>
        )}
      </div>

      {loading && <p className="page-subtitle">Loading activity…</p>}
      {error && <div className="error-banner">{error}</div>}

      {!loading && !error && (
        <div className="feed">
          {feed.length === 0 ? (
            <div className="empty-state">No activity yet. Start logging!</div>
          ) : (
            feed.map((item, i) => <FeedItem key={i} item={item} />)
          )}
        </div>
      )}
    </div>
  );
}
