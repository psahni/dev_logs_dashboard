import ConfluenceView from "@/components/views/ConfluenceView";
import { getConfluenceStatus } from "@/lib/api";

export default async function ConfluencePage() {
  const confluenceConnected = await getConfluenceStatus().catch(() => false);
  return <ConfluenceView confluenceConnected={confluenceConnected} />;
}
