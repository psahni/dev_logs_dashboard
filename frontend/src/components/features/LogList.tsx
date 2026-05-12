import type { LogEntry } from "@/lib/types";
import LogCard from "./LogCard";

type Props = { logs: LogEntry[] };

export default function LogList({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-zinc-400">
        No logs yet. Click &ldquo;New Log&rdquo; to write your first entry.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-4">
      {logs.map((log) => (
        <li key={log.id}>
          <LogCard log={log} />
        </li>
      ))}
    </ol>
  );
}
