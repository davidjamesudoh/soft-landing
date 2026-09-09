"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";

/**
 * Html5Qrcode's pause/resume/stop all throw *synchronously* (not a
 * rejected Promise) when called in the wrong state — e.g. stop() throws
 * a bare string if the camera never finished starting, or resume() throws
 * if called when not paused. A plain `.catch()` on the result doesn't
 * catch that, since the throw happens before any Promise is returned.
 */
function safeStop(scanner: Html5Qrcode) {
  try {
    if (scanner.getState() === Html5QrcodeScannerState.NOT_STARTED) return;
    scanner
      .stop()
      .catch(() => {})
      .finally(() => scanner.clear());
  } catch {
    try {
      scanner.clear();
    } catch {
      // Nothing more we can do — camera never started or is already gone.
    }
  }
}

function safePause(scanner: Html5Qrcode | null) {
  try {
    if (scanner?.getState() === Html5QrcodeScannerState.SCANNING) {
      scanner.pause(true);
    }
  } catch {
    // Ignore — already paused/stopped.
  }
}

function safeResume(scanner: Html5Qrcode | null) {
  try {
    if (scanner?.getState() === Html5QrcodeScannerState.PAUSED) {
      scanner.resume();
    }
  } catch {
    // Ignore — already scanning/stopped.
  }
}

type ScanResult =
  | { status: "ok"; name: string; tableNumber?: string }
  | { status: "already_checked_in"; name: string; tableNumber?: string }
  | { status: "not_found" | "invalid"; error: string };

const READER_ELEMENT_ID = "qr-reader";

const RESULT_STYLES: Record<ScanResult["status"], { bg: string; color: string; label: string }> = {
  ok: { bg: "#e7f6ec", color: "#146c43", label: "✅ Checked in" },
  already_checked_in: { bg: "#fdf1da", color: "#996a13", label: "⚠️ Already checked in" },
  not_found: { bg: "#fde8ee", color: "#c1335e", label: "❌ Unknown QR code" },
  invalid: { bg: "#fde8ee", color: "#c1335e", label: "❌ Invalid QR code" },
};

function ResultCard({ result, onScanNext }: { result: ScanResult; onScanNext: () => void }) {
  const s = RESULT_STYLES[result.status];
  return (
    <div
      style={{
        maxWidth: 420,
        margin: "16px auto 0",
        background: s.bg,
        borderRadius: 12,
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 700, color: s.color, marginBottom: 8 }}>{s.label}</div>
      {"name" in result && (
        <>
          <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>{result.name}</div>
          {result.tableNumber && (
            <div style={{ fontSize: 16, color: "#555" }}>Table {result.tableNumber}</div>
          )}
        </>
      )}
      {"error" in result && <div style={{ fontSize: 14, color: "#555" }}>{result.error}</div>}
      <button
        onClick={onScanNext}
        style={{
          marginTop: 16,
          padding: "10px 20px",
          borderRadius: 8,
          border: "none",
          background: "#c1335e",
          color: "#fff",
          fontWeight: 600,
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        Scan Next
      </button>
    </div>
  );
}

export default function CheckinScanner({
  onClose,
  onCheckin,
}: {
  onClose: () => void;
  /** Called after any successful lookup (fresh or duplicate) — parent should refresh its guest list. */
  onCheckin?: () => void;
}) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const handleScan = useCallback(
    async (decodedText: string) => {
      if (processingRef.current) return;
      processingRef.current = true;
      safePause(scannerRef.current);

      try {
        const res = await fetch("/api/dashboard/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrText: decodedText }),
        });
        const data = await res.json();
        setResult(data);
        if (data.status === "ok" || data.status === "already_checked_in") {
          onCheckin?.();
        }
      } catch (err) {
        setResult({
          status: "invalid",
          error: err instanceof Error ? err.message : "Network error — could not reach the server.",
        });
      }
    },
    [onCheckin],
  );

  useEffect(() => {
    const scanner = new Html5Qrcode(READER_ELEMENT_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => handleScan(decodedText),
        () => {
          // Per-frame decode misses are normal while aiming the camera — ignore.
        },
      )
      .catch((err) => {
        setCameraError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      safeStop(scanner);
    };
  }, [handleScan]);

  function scanNext() {
    setResult(null);
    processingRef.current = false;
    safeResume(scannerRef.current);
  }

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e0d8",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Check-in Scan</h2>
        <button
          onClick={onClose}
          style={{
            fontSize: 13,
            color: "#888",
            background: "none",
            border: "1px solid #ddd",
            borderRadius: 6,
            padding: "4px 10px",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>

      {cameraError && (
        <p style={{ color: "#c1335e", fontSize: 14, marginBottom: 12 }}>
          Camera error: {cameraError}. Make sure this page has camera permission (and that you&apos;re
          on HTTPS or localhost — browsers block camera access otherwise).
        </p>
      )}

      <div
        id={READER_ELEMENT_ID}
        style={{ width: "100%", maxWidth: 420, margin: "0 auto", borderRadius: 12, overflow: "hidden" }}
      />

      {result && <ResultCard result={result} onScanNext={scanNext} />}
    </div>
  );
}
