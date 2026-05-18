import { getPulls } from "@/lib/api";
import PullRequestsView from "@/components/views/PullRequestsView";

export default async function PullsPage() {
  const pulls = await getPulls().catch(() => []);
  return <PullRequestsView pulls={pulls} />;
}
