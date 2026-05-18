import { getLogs, getCommits, getPulls } from "@/lib/api";
import HomeView from "@/components/views/HomeView";

export default async function HomePage() {
  const [logs, commits, pulls] = await Promise.all([
    getLogs().catch(() => []),
    getCommits().catch(() => []),
    getPulls().catch(() => []),
  ]);
  return <HomeView logs={logs} commits={commits} pulls={pulls} />;
}
