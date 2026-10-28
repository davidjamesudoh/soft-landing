"use client";

import { useState, type CSSProperties } from "react";

function buttonStyle(disabled: boolean, color = "#c1335e"): CSSProperties {
  return {
    fontSize: 13,
    fontWeight: 600,
    padding: "8px 14px",
    borderRadius: 6,
    border: "none",
    background: disabled ? "#e5e0d8" : color,
    color: disabled ? "#999" : "#fff",
    cursor: disabled ? "default" : "pointer",
    whiteSpace: "nowrap",
  };
}

export default function ActionBar({
  selectedIds,
  onTriggered,
  onCheckedIn,
}: {
  selectedIds: string[];
  onTriggered: (message: string) => void;
  onCheckedIn: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = selectedIds.length === 0 || busy;

  async function setCheckInSelected(undo: boolean) {
    const prompt = undo
      ? `Undo check-in for ${selectedIds.length} selected guest(s)?`
      : `Check in ${selectedIds.length} selected guest(s)?`;
    if (!window.confirm(prompt)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        undo
          ? "/api/dashboard/uncheckin-selected"
          : "/api/dashboard/checkin-selected",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestIds: selectedIds }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to check in");
      } else {
        onCheckedIn(data.message ?? "Checked in.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check in");
    } finally {
      setBusy(false);
    }
  }

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
        {selectedIds.length === 0
          ? "Select guests to act on"
          : `${selectedIds.length} selected`}
      </span>

      {/* <button disabled={disabled} onClick={() => trigger("/api/dashboard/trigger-card")} style={buttonStyle(disabled)}>
        Send Access Card
      </button> */}

      {/* <button
        disabled={disabled}
        onClick={() =>
          trigger("/api/dashboard/trigger-reminder", { stage: "reminder" })
        }
        style={buttonStyle(disabled)}
      >
        Send Reminder
      </button> */}

      {/* <button
        disabled={disabled}
        onClick={() => trigger("/api/dashboard/trigger-thankyou")}
        style={buttonStyle(disabled)}
      >
        Send Thank You
      </button> */}

      <button
        disabled={disabled}
        onClick={() => setCheckInSelected(false)}
        style={buttonStyle(disabled, "#2e7d4f")}
      >
        Check In Selected Guests
      </button>

      <button
        disabled={disabled}
        onClick={() => setCheckInSelected(true)}
        style={buttonStyle(disabled, "#b45309")}
      >
        Undo Check-In
      </button>

      {error && <span style={{ color: "#c1335e", fontSize: 13 }}>{error}</span>}
    </div>
  );
}
