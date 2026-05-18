"use client";

import { useState } from "react";
import type { GitHubCommit } from "@/lib/types";
import FeedItem, { type FeedItemData } from "@/components/ui/FeedItem";

function commitToFeed(c: GitHubCommit): FeedItemData {
  return {
    type: "commit",
    title: c.message,
    date: c.date,
    repo: c.repo,
    url: c.url,
  };
}

type Props = { commits: GitHubCommit[] };

export default function CommitsView({ commits }: Props) {
  const [query, setQuery] = useState("");

  const filtered = commits.filter(
    (c) =>
      c.message.toLowerCase().includes(query.toLowerCase()) ||
      c.repo.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Commits</h1>
        <p className="page-subtitle">Recent GitHub commits</p>
      </div>

      <input
        className="search-input"
        style={{ marginBottom: "1.5rem" }}
        placeholder="Search commits…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="feed">
        {filtered.length === 0 ? (
          <div className="empty-state">
            {query ? "No commits match your search." : "No commits found."}
          </div>
        ) : (
          filtered.map((c, i) => <FeedItem key={i} item={commitToFeed(c)} />)
        )}
      </div>
    </div>
  );
}
