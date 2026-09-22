import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/dashboard/auth";
import DashboardNav from "@/components/dashboard/DashboardNav";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!verifySessionToken(token)) {
    redirect("/dashboard/admin/login");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fffcf5",
        fontFamily: "system-ui, sans-serif",
        position: "relative",
        zIndex: 99999,
      }}
    >
      <DashboardNav />
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px" }}>
        {children}
      </main>
    </div>
  );
}
