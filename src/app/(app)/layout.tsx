import { redirect } from "next/navigation";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";
import { getCurrentUser } from "@/lib/auth/current-user";

/** RF-U2 — Barrera 2 de 3: cada página vuelve a comprobar la sesión. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-black/10 bg-[#111111] text-white lg:block no-print">
        <SidebarNav user={user} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <Topbar user={user} />
        <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
