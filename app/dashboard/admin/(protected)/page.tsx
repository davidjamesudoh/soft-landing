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
  const [search, setSearch] = useState("");
  const [cardSentFilter, setCardSentFilter] = useState<"all" | "Yes" | "Not yet">("all");
  const [checkedInFilter, setCheckedInFilter] = useState<"all" | "Yes" | "Not yet">("all");

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

  const hasActiveFilters = !!search.trim() || cardSentFilter !== "all" || checkedInFilter !== "all";

  // Guests with no table number (or a non-numeric one) sort to the end,
  // in original order among themselves, rather than being interleaved.
  function byTableNumber(a: DashboardGuest, b: DashboardGuest): number {
    const aNum = a.tableNumber !== undefined ? Number(a.tableNumber) : NaN;
    const bNum = b.tableNumber !== undefined ? Number(b.tableNumber) : NaN;
    const aValid = !Number.isNaN(aNum);
    const bValid = !Number.isNaN(bNum);
    if (aValid && bValid) return aNum - bNum;
    if (aValid) return -1;
    if (bValid) return 1;
    return 0;
  }

  const filteredGuests = guests
    ? guests
        .filter((g) => {
          if (search.trim() && !g.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
          if (cardSentFilter !== "all" && g.cardSent !== cardSentFilter) return false;
          if (checkedInFilter !== "all" && g.checkedIn !== checkedInFilter) return false;
          return true;
        })
        .sort(byTableNumber)
    : guests;

  function toggleAll() {
    if (!filteredGuests) return;
    const filteredIds = filteredGuests.map((g) => g.id);
    const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const id of filteredIds) next.delete(id);
      } else {
        for (const id of filteredIds) next.add(id);
      }
      return next;
    });
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
            <>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name…"
                  style={{
                    flex: "1 1 220px",
                    maxWidth: 320,
                    padding: "8px 10px",
                    fontSize: 14,
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    boxSizing: "border-box",
                  }}
                />
                <select
                  value={cardSentFilter}
                  onChange={(e) => setCardSentFilter(e.target.value as "all" | "Yes" | "Not yet")}
                  style={{ padding: "8px 10px", fontSize: 14, borderRadius: 6, border: "1px solid #ccc" }}
                >
                  <option value="all">Card Sent: All</option>
                  <option value="Yes">Card Sent: Yes</option>
                  <option value="Not yet">Card Sent: Not yet</option>
                </select>
                <select
                  value={checkedInFilter}
                  onChange={(e) => setCheckedInFilter(e.target.value as "all" | "Yes" | "Not yet")}
                  style={{ padding: "8px 10px", fontSize: 14, borderRadius: 6, border: "1px solid #ccc" }}
                >
                  <option value="all">Checked In: All</option>
                  <option value="Yes">Checked In: Yes</option>
                  <option value="Not yet">Checked In: Not yet</option>
                </select>
              </div>
              {hasActiveFilters && (
                <p style={{ fontSize: 12, color: "#999", marginTop: -6, marginBottom: 10 }}>
                  {filteredGuests?.length ?? 0} of {guests.length} guests match the current filters
                </p>
              )}

              {filteredGuests && filteredGuests.length === 0 ? (
                <p style={{ color: "#666", fontSize: 14 }}>No guests match the current filters.</p>
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
                            !!filteredGuests &&
                            filteredGuests.length > 0 &&
                            filteredGuests.every((g) => selected.has(g.id))
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
                    {filteredGuests?.map((g) => (
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
        </>
      )}
    </div>
  );
}
