"use client";

import { useEffect, useRef, useState } from "react";

interface JobStatus {
  running: boolean;
  action: { type: string; stage?: string } | null;
  total: number;
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
  currentGuest: string | null;
  recentLog: string[];
}

/** pollKey > 0 (and changed) starts a fresh polling cycle; 0 means idle/hidden. */
export default function JobStatusPanel({
  pollKey,
  onDone,
}: {
  pollKey: number;
  onDone: () => void;
}) {
  const [status, setStatus] = useState<JobStatus | null>(null);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (pollKey === 0) return;

    let cancelled = false;
    let notifiedDone = false;

    const poll = async () => {
      const res = await fetch("/api/dashboard/status");
      const data = await res.json();
      if (cancelled || !res.ok) return;

      setStatus(data);
      if (!data.running && !notifiedDone) {
        notifiedDone = true;
        onDoneRef.current();
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pollKey]);

  if (!status || pollKey === 0) return null;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e0d8",
        borderRadius: 10,
        padding: 14,
        marginBottom: 20,
        fontSize: 13,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        {status.running ? "Sending…" : "Last run finished"}
        {status.action &&
          ` — ${status.action.type}${status.action.stage ? ` (${status.action.stage})` : ""}`}
      </div>
      <div style={{ color: "#666", marginBottom: 6 }}>
        {status.processed}/{status.total} processed
        {status.currentGuest ? ` — currently: ${status.currentGuest}` : ""}
        {" · "}
        ✅ {status.sent} &nbsp; ⚠️ {status.skipped} &nbsp; ❌ {status.failed}
      </div>
      {status.recentLog.length > 0 && (
        <div
          style={{
            maxHeight: 120,
            overflowY: "auto",
            fontFamily: "monospace",
            fontSize: 11,
            color: "#888",
            background: "#faf8f3",
            borderRadius: 6,
            padding: 8,
          }}
        >
          {status.recentLog.slice(-10).map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}
