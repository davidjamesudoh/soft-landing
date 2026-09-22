"use client";

import { useState, type CSSProperties } from "react";

// Keep in sync with scripts/config.ts REMINDER_STAGES (key + label only —
// this is just a client-side picker, the server owns the actual field
// names/message copy).
const REMINDER_STAGES = [
  { key: "30d", label: "30 days to go" },
  { key: "14d", label: "2 weeks to go" },
  { key: "7d", label: "7 days to go" },
  { key: "3d", label: "3 days to go" },
  { key: "1d", label: "1 day to go" },
  { key: "morning", label: "Morning of" },
];

function buttonStyle(disabled: boolean): CSSProperties {
  return {
    fontSize: 13,
    fontWeight: 600,
    padding: "8px 14px",
    borderRadius: 6,
    border: "none",
    background: disabled ? "#e5e0d8" : "#c1335e",
    color: disabled ? "#999" : "#fff",
    cursor: disabled ? "default" : "pointer",
    whiteSpace: "nowrap",
  };
}

export default function ActionBar({
  selectedIds,
  onTriggered,
}: {
  selectedIds: string[];
  onTriggered: (message: string) => void;
}) {
  const [stage, setStage] = useState(REMINDER_STAGES[0].key);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = selectedIds.length === 0 || busy;

  async function trigger(path: string, extraBody?: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestIds: selectedIds, ...extraBody }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.message || "Failed to trigger");
      } else {
        onTriggered(data.message ?? "Triggered.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        background: "#fff",
        border: "1px solid #e5e0d8",
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
      }}
    >
      <span style={{ fontSize: 13, color: "#666" }}>
        {selectedIds.length === 0 ? "Select guests to act on" : `${selectedIds.length} selected`}
      </span>

      <button disabled={disabled} onClick={() => trigger("/api/dashboard/trigger-card")} style={buttonStyle(disabled)}>
        Send Access Card
      </button>

      <select
        value={stage}
        onChange={(e) => setStage(e.target.value)}
        disabled={busy}
        style={{ fontSize: 13, padding: "7px 8px", borderRadius: 6, border: "1px solid #ccc" }}
      >
        {REMINDER_STAGES.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>
      <button
        disabled={disabled}
        onClick={() => trigger("/api/dashboard/trigger-reminder", { stage })}
        style={buttonStyle(disabled)}
      >
        Send Reminder
      </button>

      <button
        disabled={disabled}
        onClick={() => trigger("/api/dashboard/trigger-thankyou")}
        style={buttonStyle(disabled)}
      >
        Send Thank You
      </button>

      {error && <span style={{ color: "#c1335e", fontSize: 13 }}>{error}</span>}
    </div>
  );
}
