"use client";

import { useState, useTransition } from "react";
import { generateConfluence, generateStandup } from "@/lib/api";

type Props = {
  type: "confluence" | "standup";
  label: string;
};

export default function GeneratePanel({ type, label }: Props) {
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    startTransition(async () => {
      setError(null);
      try {
        const content = type === "confluence"
          ? await generateConfluence()
          : await generateStandup();
        setOutput(content);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Generation failed");
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
    <div className="flex-1">
      <button
        onClick={handleGenerate}
        disabled={isPending}
        className="font-accent w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
      >
        {isPending ? "Generating…" : label}
      </button>

      {error && (
        <div className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {output && !isPending && (
        <div className="mt-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs text-zinc-400">Output</span>
            <button
              onClick={handleCopy}
              className="font-accent rounded px-2 py-0.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="font-code max-h-72 overflow-y-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-800 whitespace-pre-wrap">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
