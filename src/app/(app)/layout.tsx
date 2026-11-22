import { redirect } from "next/navigation";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { AppShell } from "@/components/layout/app-shell";
import { Topbar } from "@/components/layout/topbar";
import { getCurrentUser } from "@/lib/auth/current-user";

/** RF-U2 — Barrera 2 de 3: cada página vuelve a comprobar la sesión. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell sidebar={<SidebarNav user={user} />} topbar={<Topbar user={user} />}>
      {children}
    </AppShell>
  );
}
