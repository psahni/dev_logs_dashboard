import { getLogs } from "@/lib/api";
import LogDashboard from "@/components/features/LogDashboard";

export default async function Home() {
  const logs = await getLogs();
  return <LogDashboard initialLogs={logs} />;
}
