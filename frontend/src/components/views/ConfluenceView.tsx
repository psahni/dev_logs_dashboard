"use client";

import { useState, useTransition } from "react";
import { generateConfluence, publishToConfluence } from "@/lib/api";

const SOURCES = [
  { id: "logs", label: "Dev Logs" },
  { id: "commits", label: "GitHub Commits" },
  { id: "prs", label: "Pull Requests" },
];

type Props = { confluenceConnected: boolean };

export default function ConfluenceView({ confluenceConnected }: Props) {
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pageUrl, setPageUrl] = useState<string | null>(null);
  const [isPublishing, startPublish] = useTransition();
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    startTransition(async () => {
      setError(null);
      setPageUrl(null);
      try {
        const content = await generateConfluence();
        setOutput(content);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Generation failed");
      }
    });
  }

  function handlePublish() {
    if (!output) return;
    startPublish(async () => {
      setError(null);
      try {
        const url = await publishToConfluence("Dev Digest", output);
        setPageUrl(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Publish failed");
      }
    });
  }

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Confluence Doc</h1>
        <p className="page-subtitle">Generate a Confluence-ready doc from your activity</p>
      </div>

      <div className="generator-shell">
        <div className="generator-sources">
          <div className="generator-sources-title">Sources</div>
          {SOURCES.map((s) => (
            <label key={s.id} className="generator-source-item">
              <input type="checkbox" defaultChecked readOnly />
              {s.label}
            </label>
          ))}
          <div style={{ marginTop: "1rem" }}>
            <button
              className="btn-primary"
              style={{ width: "100%" }}
              onClick={handleGenerate}
              disabled={isPending}
            >
              {isPending ? "Generating…" : "Generate"}
            </button>
          </div>
          {output && confluenceConnected && (
            <div style={{ marginTop: "0.5rem" }}>
              <button
                className="btn-secondary"
                style={{ width: "100%" }}
                onClick={handlePublish}
                disabled={isPublishing}
              >
                {isPublishing ? "Publishing…" : "Publish to Confluence"}
              </button>
            </div>
          )}
          {!confluenceConnected && (
            <p style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--ink-faint)" }}>
              Connect Confluence in Settings to enable publishing.
            </p>
          )}
        </div>

        <div className="generator-output">
          <div className="generator-output-title">Confluence Doc</div>
          {error && <div className="error-banner">{error}</div>}
          {pageUrl && (
            <div style={{ marginBottom: "0.75rem", padding: "0.5rem 0.75rem", background: "color-mix(in srgb, var(--green) 12%, transparent)", borderRadius: "6px", fontSize: "0.85rem" }}>
              Published!{" "}
              <a href={pageUrl} target="_blank" rel="noreferrer" style={{ color: "var(--green)", textDecoration: "underline" }}>
                View page
              </a>
            </div>
          )}
          {!output && !isPending && (
            <div className="generator-placeholder">
              Click Generate to create your Confluence doc
            </div>
          )}
          {isPending && (
            <div className="generator-placeholder">Generating…</div>
          )}
          {output && !isPending && (
            <>
              <pre className="generator-pre">{output}</pre>
              <div>
                <button className="btn-secondary" onClick={handleCopy}>
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
