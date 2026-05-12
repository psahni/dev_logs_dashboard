"use client";

import { useState } from "react";
import type { LogEntry } from "@/lib/types";
import LogList from "./LogList";
import NewLogModal from "./NewLogModal";

type Props = { initialLogs: LogEntry[] };

export default function LogDashboard({ initialLogs }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleLogCreated(created: LogEntry) {
    setLogs((prev) => [created, ...prev]);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Dev Logs</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + New Log
        </button>
      </div>

      <LogList logs={logs} />

      {isModalOpen && (
        <NewLogModal
          onSuccess={handleLogCreated}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
