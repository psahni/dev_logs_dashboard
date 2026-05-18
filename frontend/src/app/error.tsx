"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="empty-state" style={{ padding: "4rem", textAlign: "center" }}>
      <p style={{ marginBottom: "1rem", color: "var(--ink-2)" }}>
        Something went wrong — {error.message || "unexpected error"}
      </p>
      <button className="btn-secondary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
