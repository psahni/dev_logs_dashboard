import type { LogEntry } from "@/lib/types";
import TagChip from "@/components/ui/TagChip";

type Props = { log: LogEntry };

export default function LogCard({ log }: Props) {
  const tags = log.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const formattedDate = new Date(log.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-base font-semibold text-zinc-900">{log.title}</h2>
        <time className="font-accent shrink-0 text-sm text-zinc-400">{formattedDate}</time>
      </div>
      <p className="font-code mt-2 text-sm leading-relaxed text-zinc-600">
        {log.description}
      </p>
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </div>
      )}
    </article>
  );
}
