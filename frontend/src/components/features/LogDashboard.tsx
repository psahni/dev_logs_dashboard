"use client";

import { useState } from "react";
import type { GitHubCommit, GitHubPR, LogEntry } from "@/lib/types";
import LogList from "./LogList";
import NewLogModal from "./NewLogModal";
import GitHubActivityWidget from "./GitHubActivityWidget";

type Props = {
  initialLogs: LogEntry[];
  initialCommits: GitHubCommit[];
  initialPulls: GitHubPR[];
};

export default function LogDashboard({ initialLogs, initialCommits, initialPulls }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleLogCreated(created: LogEntry) {
    setLogs((prev) => [created, ...prev]);
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Dev Logs</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="font-accent rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + New Log
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <LogList logs={logs} />
        </div>
        <div>
          <GitHubActivityWidget
            initialCommits={initialCommits}
            initialPulls={initialPulls}
          />
        </div>
      </div>

      {isModalOpen && (
        <NewLogModal
          onSuccess={handleLogCreated}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
