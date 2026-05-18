"use client";

import { useState } from "react";
import type { LogEntry } from "@/lib/types";
import FeedItem, { type FeedItemData } from "@/components/ui/FeedItem";
import NewLogModal from "@/components/features/NewLogModal";

function logToFeed(log: LogEntry): FeedItemData {
  return {
    type: "log",
    title: log.title,
    date: log.created_at,
    tags: log.tags ? log.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
  };
}

type Props = { initialLogs: LogEntry[] };

export default function ActivityLogView({ initialLogs }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Activity Log</h1>
          <p className="page-subtitle">Your dev log entries</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + New Log
        </button>
      </div>

      <div className="feed">
        {logs.length === 0 ? (
          <div className="empty-state">No logs yet. Create your first entry!</div>
        ) : (
          logs.map((log) => <FeedItem key={log.id} item={logToFeed(log)} />)
        )}
      </div>

      {showModal && (
        <NewLogModal
          onSuccess={(created) => {
            setLogs((prev) => [created, ...prev]);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
