"use client";

import { useCallback, useEffect, useState } from "react";
import ActionBar from "@/components/dashboard/ActionBar";
import CheckinScanner from "@/components/dashboard/CheckinScanner";
import JobStatusPanel from "@/components/dashboard/JobStatusPanel";
import Loader from "@/components/dashboard/Loader";
import type { DashboardGuest } from "@/lib/dashboard/airtable";

// Matches EVENT_DATE in scripts/config.ts (Lagos time, date-only here).
const EVENT_DAY = "2026-10-30";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        flex: 1,
        background: "#fff",
        border: "1px solid #e5e0d8",
        borderRadius: 10,
        padding: "14px 16px",
      }}
    >
      <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function Badge({ value }: { value: "Yes" | "Not yet" }) {
  const isYes = value === "Yes";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color: isYes ? "#146c43" : "#996a13",
        background: isYes ? "#e7f6ec" : "#fdf1da",
      }}
    >
      {value}
    </span>
  );
}

export default function DashboardHomePage() {
  const [guests, setGuests] = useState<DashboardGuest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pollKey, setPollKey] = useState(0);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [isEventDay] = useState(
    () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" }) === EVENT_DAY,
  );
  const [scannerOpen, setScannerOpen] = useState(false);

  const loadGuests = useCallback(() => {
    fetch("/api/dashboard/guests")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load guests");
        setGuests(data.guests);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load guests");
      });
  }, []);

  useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (!guests) return;
    setSelected((prev) =>
      prev.size === guests.length
        ? new Set()
        : new Set(guests.map((g) => g.id)),
    );
  }

  function handleTriggered(message: string) {
    setLastMessage(message);
    setPollKey((k) => k + 1);
  }

  function handleJobDone() {
    loadGuests(); // statuses changed in Airtable — refresh the table
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Overview</h1>

      {error && (
        <p style={{ color: "#c1335e", fontSize: 14 }}>
          Couldn&apos;t load guests: {error}
        </p>
      )}

      {!error && !guests && <Loader label="Fetching guests from Airtable…" />}

      {guests && (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <StatCard label="Confirmed guests" value={guests.length} />
            <StatCard
              label="Cards sent"
              value={`${guests.filter((g) => g.cardSent === "Yes").length} / ${guests.length}`}
            />
            <StatCard
              label="Checked in"
              value={`${guests.filter((g) => g.checkedIn === "Yes").length} / ${guests.length}`}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <button
              disabled={!isEventDay}
              onClick={() => setScannerOpen(true)}
              title={
                isEventDay
                  ? undefined
                  : `Available on the wedding day (${EVENT_DAY})`
              }
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: "8px 14px",
                borderRadius: 6,
                border: "none",
                background: isEventDay ? "#c1335e" : "#e5e0d8",
                color: isEventDay ? "#fff" : "#999",
                cursor: isEventDay ? "pointer" : "default",
              }}
            >
              📷 Scan Check-in
            </button>
            {!isEventDay && (
              <span style={{ fontSize: 12, color: "#999" }}>
                Opens on the wedding day ({EVENT_DAY})
              </span>
            )}
          </div>

          {scannerOpen && (
            <CheckinScanner
              onClose={() => setScannerOpen(false)}
              onCheckin={loadGuests}
            />
          )}

          <ActionBar
            selectedIds={[...selected]}
            onTriggered={handleTriggered}
          />

          {lastMessage && (
            <p
              style={{
                fontSize: 13,
                color: "#666",
                marginTop: -8,
                marginBottom: 12,
              }}
            >
              {lastMessage}
            </p>
          )}

          <JobStatusPanel pollKey={pollKey} onDone={handleJobDone} />

          {guests.length === 0 ? (
            <p style={{ color: "#666", fontSize: 14 }}>
              No confirmed guests yet.
            </p>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    borderBottom: "2px solid #e5e0d8",
                  }}
                >
                  <th style={{ padding: "8px 6px" }}>
                    <input
                      type="checkbox"
                      checked={
                        guests.length > 0 && selected.size === guests.length
                      }
                      onChange={toggleAll}
                    />
                  </th>
                  <th style={{ padding: "8px 6px" }}>Name</th>
                  <th style={{ padding: "8px 6px" }}>Phone</th>
                  <th style={{ padding: "8px 6px" }}>Table</th>
                  <th style={{ padding: "8px 6px" }}>Card Sent</th>
                  <th style={{ padding: "8px 6px" }}>Checked In</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((g) => (
                  <tr key={g.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "8px 6px" }}>
                      <input
                        type="checkbox"
                        checked={selected.has(g.id)}
                        onChange={() => toggleOne(g.id)}
                      />
                    </td>
                    <td style={{ padding: "8px 6px" }}>{g.name}</td>
                    <td style={{ padding: "8px 6px" }}>{g.phone}</td>
                    <td style={{ padding: "8px 6px" }}>
                      {g.tableNumber ?? "—"}
                    </td>
                    <td style={{ padding: "8px 6px" }}>
                      <Badge value={g.cardSent} />
                    </td>
                    <td style={{ padding: "8px 6px" }}>
                      <Badge value={g.checkedIn} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
