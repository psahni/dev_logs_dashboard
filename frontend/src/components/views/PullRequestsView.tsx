import type { GitHubPR } from "@/lib/types";
import FeedItem, { type FeedItemData } from "@/components/ui/FeedItem";

function prToFeed(p: GitHubPR): FeedItemData {
  return {
    type: "pr",
    title: p.title,
    date: p.date,
    repo: p.repo,
    url: p.url,
    status: p.state,
  };
}

type Group = { heading: string; items: GitHubPR[] };

function groupPRs(pulls: GitHubPR[]): Group[] {
  return [
    { heading: "Open", items: pulls.filter((p) => p.state === "open") },
    { heading: "Recently Merged", items: pulls.filter((p) => p.state === "merged") },
    { heading: "Drafts", items: [] },
  ];
}

type Props = { pulls: GitHubPR[] };

export default function PullRequestsView({ pulls }: Props) {
  const groups = groupPRs(pulls);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Pull Requests</h1>
        <p className="page-subtitle">GitHub pull requests by status</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {groups.map((group) => (
          <div key={group.heading}>
            <h2 className="section-title">{group.heading}</h2>
            <div className="feed">
              {group.items.length === 0 ? (
                <div className="empty-state">None</div>
              ) : (
                group.items.map((p, i) => <FeedItem key={i} item={prToFeed(p)} />)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
