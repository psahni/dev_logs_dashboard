"use client";

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

type Props = {
  logs: LogEntry[];
  commits: GitHubCommit[];
  pulls: GitHubPR[];
};

export default function HomeView({ logs, commits, pulls }: Props) {
  const feed = [
    ...logsToFeed(logs),
    ...commitsToFeed(commits),
    ...pullsToFeed(pulls),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{getGreeting()}, Prashant</h1>
        <p className="page-subtitle">
          {feed.length} update{feed.length !== 1 ? "s" : ""} across your workspace
        </p>
      </div>

      <div className="feed">
        {feed.length === 0 ? (
          <div className="empty-state">No activity yet. Start logging!</div>
        ) : (
          feed.map((item, i) => <FeedItem key={i} item={item} />)
        )}
      </div>
    </div>
  );
}
