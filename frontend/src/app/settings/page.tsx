import SettingsView from "@/components/views/SettingsView";
import { getConfluenceStatus } from "@/lib/api";

export default async function SettingsPage() {
  const confluenceConnected = await getConfluenceStatus().catch(() => false);
  return <SettingsView confluenceConnected={confluenceConnected} />;
}
