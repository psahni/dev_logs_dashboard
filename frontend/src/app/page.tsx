import { getCommits, getLogs, getPulls } from "@/lib/api";
import LogDashboard from "@/components/features/LogDashboard";

export default async function Home() {
  const [logs, commits, pulls] = await Promise.all([
    getLogs(),
    getCommits().catch(() => []),
    getPulls().catch(() => []),
  ]);
  return <LogDashboard initialLogs={logs} initialCommits={commits} initialPulls={pulls} />;
}
