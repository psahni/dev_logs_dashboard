import { getLogs } from "@/lib/api";
import ActivityLogView from "@/components/views/ActivityLogView";

export default async function ActivityPage() {
  const logs = await getLogs().catch(() => []);
  return <ActivityLogView initialLogs={logs} />;
}
