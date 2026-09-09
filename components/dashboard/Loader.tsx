export default function Loader({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        color: "#888",
        fontSize: 14,
        padding: "24px 0",
      }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: "2px solid #e5e0d8",
          borderTopColor: "#c1335e",
          animation: "dashboard-spin 0.7s linear infinite",
        }}
      />
      {label}
      <style>{`
        @keyframes dashboard-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
