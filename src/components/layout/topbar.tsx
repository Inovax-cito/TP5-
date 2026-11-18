"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Menu, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { SidebarNav } from "./sidebar-nav";
import type { AuthUser } from "@/lib/db/schema";

export function Topbar({ user }: { user: AuthUser }) {
  const router = useRouter();
  const [menuAbierto, setMenuAbierto] = useState(false);

  async function salir() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Sesión cerrada");
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur lg:px-8 no-print">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuAbierto(true)}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menú</span>
          </Button>
          <span className="text-sm font-semibold lg:hidden">Gestión Comercial</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserIcon className="h-4 w-4" />
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-semibold leading-tight">{user.nombre}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {user.rol === "admin" ? "Administrador" : "Vendedor"}
                </span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/perfil">Mi perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={salir} className="text-destructive">
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <Dialog open={menuAbierto} onOpenChange={setMenuAbierto}>
        <DialogContent className="left-0 top-0 h-full max-w-[280px] translate-x-0 translate-y-0 rounded-none p-0 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left">
          <DialogTitle className="sr-only">Menú de navegación</DialogTitle>
          <SidebarNav user={user} onNavigate={() => setMenuAbierto(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
