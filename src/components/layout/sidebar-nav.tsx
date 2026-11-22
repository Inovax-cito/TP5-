"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  UserCog,
  Users,
} from "lucide-react";
import { BrandMark } from "@/components/layout/brand-mark";
import { RolBadge } from "@/components/common/status-badge";
import type { AuthUser } from "@/lib/db/schema";
import { cn, iniciales } from "@/lib/utils";

/** Mismos módulos, rutas y orden de siempre; los grupos son solo rótulos visuales. */
const GRUPOS = [
  {
    rotulo: "Operación",
    modulos: [
      { href: "/", label: "Inicio", icon: LayoutDashboard, todos: true },
      { href: "/ventas/nueva", label: "Ventas", icon: ShoppingCart, todos: true, activoEn: ["/ventas"] },
    ],
  },
  {
    rotulo: "Gestión",
    modulos: [
      { href: "/productos", label: "Productos", icon: Package, todos: true, activoEn: ["/productos"] },
      { href: "/clientes", label: "Clientes", icon: Users, todos: true, activoEn: ["/clientes", "/pagos"] },
    ],
  },
  {
    rotulo: "Administración",
    modulos: [{ href: "/usuarios", label: "Usuarios", icon: UserCog, todos: false, activoEn: ["/usuarios"] }],
  },
];

export function SidebarNav({ user, onNavigate }: { user: AuthUser; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-5">
        <BrandMark />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight tracking-tight text-sidebar-foreground">
            Ferretería El Martillo
          </p>
          <p className="text-[11px] leading-tight text-sidebar-muted">Gestión comercial</p>
        </div>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Módulos">
        {GRUPOS.map((grupo) => {
          const visibles = grupo.modulos.filter((m) => m.todos || user.rol === "admin");
          if (visibles.length === 0) return null;
          return (
            <div key={grupo.rotulo} className="space-y-1">
              <p className="px-3 pb-1.5 text-micro uppercase text-sidebar-muted/80">{grupo.rotulo}</p>
              {visibles.map((modulo) => {
                const activo =
                  modulo.href === "/"
                    ? pathname === "/"
                    : (modulo.activoEn ?? [modulo.href]).some((prefijo) => pathname.startsWith(prefijo));
                const Icono = modulo.icon;
                return (
                  <Link
                    key={modulo.href}
                    href={modulo.href}
                    onClick={onNavigate}
                    aria-current={activo ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-accent",
                      activo
                        ? "bg-white/[0.07] text-white"
                        : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-sidebar-accent transition-opacity",
                        activo ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <Icono
                      className={cn(
                        "h-[18px] w-[18px] shrink-0 transition-colors",
                        activo ? "text-sidebar-accent" : "text-sidebar-muted group-hover:text-sidebar-foreground",
                      )}
                    />
                    {modulo.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-control bg-white/[0.04] p-2.5 ring-1 ring-inset ring-white/[0.06]">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primaryText text-xs font-bold text-primary-foreground">
            {iniciales(user.nombre)}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-sm font-semibold leading-none text-sidebar-foreground">{user.nombre}</p>
            <RolBadge rol={user.rol} tono="oscuro" />
          </div>
        </div>
      </div>
    </div>
  );
}
