import { getLogs } from "@/lib/api";
import ActivityLogView from "@/components/views/ActivityLogView";

export default async function ActivityPage() {
  const logs = await getLogs();
  return <ActivityLogView initialLogs={logs} />;
}
