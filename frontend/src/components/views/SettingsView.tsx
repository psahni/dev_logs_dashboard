import Chip from "@/components/ui/Chip";

type IntegrationCard = {
  name: string;
  description: string;
  connected: boolean;
};

const INTEGRATIONS: IntegrationCard[] = [
  {
    name: "GitHub",
    description: "Sync commits and pull requests from your GitHub account.",
    connected: true,
  },
  {
    name: "Groq",
    description: "AI-powered standup and doc generation via Llama 3.3.",
    connected: true,
  },
  {
    name: "Slack",
    description: "Post standups directly to your team Slack channel.",
    connected: false,
  },
  {
    name: "Confluence",
    description: "Publish generated docs directly to your Confluence space.",
    connected: false,
  },
];

export default function SettingsView() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your integrations</p>
      </div>

      <div className="settings-grid">
        {INTEGRATIONS.map((card) => (
          <div key={card.name} className="settings-card">
            <div className="settings-card-name">{card.name}</div>
            <div className="settings-card-desc">{card.description}</div>
            <div className="settings-card-footer">
              {card.connected ? (
                <Chip label="Connected" variant="green" />
              ) : (
                <Chip label="Not connected" variant="amber" />
              )}
              {!card.connected && (
                <button className="btn-secondary" disabled>
                  Connect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
