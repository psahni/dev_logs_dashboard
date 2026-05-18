import { getCommits } from "@/lib/api";
import CommitsView from "@/components/views/CommitsView";

export default async function CommitsPage() {
  const commits = await getCommits().catch(() => []);
  return <CommitsView commits={commits} />;
}
