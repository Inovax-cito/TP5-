"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";
import type { AuthUser } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const MODULOS = [
  { href: "/", label: "Inicio", icon: LayoutDashboard, todos: true },
  { href: "/ventas/nueva", label: "Ventas", icon: ShoppingCart, todos: true, activoEn: ["/ventas"] },
  { href: "/productos", label: "Productos", icon: Package, todos: true, activoEn: ["/productos"] },
  { href: "/clientes", label: "Clientes", icon: Users, todos: true, activoEn: ["/clientes"] },
  { href: "/usuarios", label: "Usuarios", icon: UserCog, todos: false, activoEn: ["/usuarios"] },
];

export function SidebarNav({ user, onNavigate }: { user: AuthUser; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Wrench className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-black leading-tight text-white">Ferretería El Martillo</p>
          <p className="text-[11px] text-white/50">Gestión comercial</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">Módulos</p>
        {MODULOS.filter((m) => m.todos || user.rol === "admin").map((modulo) => {
          const activo = modulo.href === "/"
            ? pathname === "/"
            : (modulo.activoEn ?? [modulo.href]).some((prefijo) => pathname.startsWith(prefijo));
          const Icono = modulo.icon;
          return (
            <Link
              key={modulo.href}
              href={modulo.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                activo
                  ? "bg-primary font-semibold text-[#111111] shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icono className="h-4 w-4" />
              {modulo.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <p className="text-[11px] text-white/50">
          {user.rol === "admin" ? "Administrador" : "Vendedor"} · v1.0
        </p>
      </div>
    </div>
  );
}
