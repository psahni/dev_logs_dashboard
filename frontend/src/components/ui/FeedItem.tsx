import Chip from "@/components/ui/Chip";

export type FeedItemData = {
  type: "log" | "commit" | "pr";
  title: string;
  date: string;
  repo?: string;
  url?: string;
  tags?: string[];
  status?: "open" | "merged" | "draft";
};

type Props = { item: FeedItemData };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function prStatusVariant(status?: string) {
  if (status === "open") return "green" as const;
  if (status === "merged") return "violet" as const;
  return "amber" as const;
}

export default function FeedItem({ item }: Props) {
  return (
    <div className="feed-item">
      <div className={`feed-dot feed-dot-${item.type}`} />
      <div className="feed-item-body">
        <div className="feed-item-title">
          {item.url ? (
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              {item.title}
            </a>
          ) : (
            item.title
          )}
        </div>
        <div className="feed-item-meta">
          <span>{formatDate(item.date)}</span>
          {item.repo && (
            <>
              <span>·</span>
              <span>{item.repo}</span>
            </>
          )}
          {item.type === "pr" && item.status && (
            <>
              <span>·</span>
              <Chip label={item.status} variant={prStatusVariant(item.status)} />
            </>
          )}
        </div>
        {item.tags && item.tags.length > 0 && (
          <div className="feed-item-tags">
            {item.tags.map((tag) => (
              <Chip key={tag} label={tag} variant="violet" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
