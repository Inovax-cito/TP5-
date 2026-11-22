"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, LogOut, Menu, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { RolBadge } from "@/components/common/status-badge";
import { BrandMark } from "./brand-mark";
import { SidebarNav, iniciales } from "./sidebar-nav";
import type { AuthUser } from "@/lib/db/schema";

/** Rótulos de las migas de pan. Solo se enlazan los segmentos que tienen página propia. */
const SEGMENTOS: Record<string, { label: string; enlace?: boolean }> = {
  ventas: { label: "Ventas", enlace: true },
  nueva: { label: "Nueva venta" },
  productos: { label: "Productos", enlace: true },
  categorias: { label: "Categorías" },
  movimientos: { label: "Movimientos" },
  clientes: { label: "Clientes", enlace: true },
  saldos: { label: "Saldos" },
  pagos: { label: "Recibos" },
  usuarios: { label: "Usuarios" },
  perfil: { label: "Mi perfil" },
};

function migas(pathname: string) {
  const partes = pathname.split("/").filter(Boolean);
  if (partes.length === 0) return [{ label: "Inicio", href: undefined as string | undefined }];
  return partes.map((parte, i) => {
    const href = "/" + partes.slice(0, i + 1).join("/");
    const info = SEGMENTOS[parte];
    const esUltimo = i === partes.length - 1;
    if (!info) return { label: /^\d+$/.test(parte) ? "Detalle" : parte, href: undefined };
    return { label: info.label, href: info.enlace && !esUltimo ? href : undefined };
  });
}

export function Topbar({ user, acciones }: { user: AuthUser; acciones?: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const items = migas(pathname);

  async function salir() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Sesión cerrada");
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="no-print sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border/70 bg-background/75 px-4 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/65 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="icon" className="-ml-2 shrink-0 lg:hidden" onClick={() => setMenuAbierto(true)}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menú</span>
          </Button>
          <BrandMark className="h-8 w-8 lg:hidden" />
          <nav aria-label="Migas de pan" className="min-w-0">
            <ol className="flex min-w-0 items-center gap-1.5 text-sm">
              <li className="hidden sm:block">
                <Link href="/" className="font-medium text-muted-foreground transition hover:text-foreground">
                  Ferretería El Martillo
                </Link>
              </li>
              {items.map((item, i) => (
                <Fragment key={`${item.label}-${i}`}>
                  <li aria-hidden="true" className="hidden sm:block">
                    <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
                  </li>
                  <li className={i === items.length - 1 ? "min-w-0" : "hidden sm:block"}>
                    {item.href ? (
                      <Link href={item.href} className="font-medium text-muted-foreground transition hover:text-foreground">
                        {item.label}
                      </Link>
                    ) : (
                      <span
                        aria-current={i === items.length - 1 ? "page" : undefined}
                        className={
                          i === items.length - 1
                            ? "block truncate font-semibold text-foreground"
                            : "font-medium text-muted-foreground"
                        }
                      >
                        {item.label}
                      </span>
                    )}
                  </li>
                </Fragment>
              ))}
            </ol>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {acciones}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 gap-2.5 rounded-full pl-1 pr-1 sm:rounded-control sm:pr-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primaryText text-xs font-bold text-primary-foreground ring-2 ring-background">
                  {iniciales(user.nombre)}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-semibold leading-tight">{user.nombre}</span>
                  <span className="block text-[11px] leading-tight text-muted-foreground">
                    {user.rol === "admin" ? "Administrador" : "Vendedor"}
                  </span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="space-y-1.5">
                <span className="block truncate text-sm font-semibold">{user.nombre}</span>
                <span className="block truncate text-xs font-normal text-muted-foreground">{user.email}</span>
                <RolBadge rol={user.rol} />
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/perfil">
                  <UserRound /> Mi perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={salir} className="text-destructive focus:bg-destructive/[0.08] focus:text-destructive [&_svg]:!text-destructive">
                <LogOut /> Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
        <SheetContent className="lg:hidden">
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <SidebarNav user={user} onNavigate={() => setMenuAbierto(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
