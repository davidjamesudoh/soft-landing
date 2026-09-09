"use client";

import { useRouter } from "next/navigation";

export default function DashboardNav() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/dashboard/logout", { method: "POST" });
    router.push("/dashboard/admin/login");
    router.refresh();
  }

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 20px",
        borderBottom: "1px solid #e5e0d8",
        background: "#fff",
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 700, color: "#444" }}>Dashboard</span>
      <button
        onClick={handleLogout}
        style={{
          fontSize: 13,
          color: "#888",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        Sign out
      </button>
    </nav>
  );
}
