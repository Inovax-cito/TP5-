"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type Filtro = {
  name: string;
  label: string;
  tipo?: "texto" | "fecha" | "select";
  placeholder?: string;
  opciones?: Array<{ value: string; label: string }>;
};

/** Filtros y búsqueda viven en la URL: el listado se puede recargar y compartir. */
export function FilterBar({ filtros, className }: { filtros: Filtro[]; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [valores, setValores] = useState<Record<string, string>>(() =>
    Object.fromEntries(filtros.map((f) => [f.name, searchParams.get(f.name) ?? ""])),
  );

  function aplicar(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    for (const [clave, valor] of Object.entries(valores)) {
      if (valor) params.set(clave, valor);
    }
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function limpiar() {
    setValores(Object.fromEntries(filtros.map((f) => [f.name, ""])));
    router.push(pathname);
  }

  const hayFiltros = Object.values(valores).some(Boolean);

  return (
    <form onSubmit={aplicar} className={cn("rounded-card border border-border/80 bg-card p-4 shadow-elevation-1 sm:p-5", className)}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {filtros.map((filtro) => (
          <div key={filtro.name} className="space-y-1.5">
            <Label htmlFor={`f-${filtro.name}`} className="text-micro uppercase text-muted-foreground">
              {filtro.label}
            </Label>
            {filtro.tipo === "select" ? (
              <select
                id={`f-${filtro.name}`}
                value={valores[filtro.name] ?? ""}
                onChange={(e) => setValores((v) => ({ ...v, [filtro.name]: e.target.value }))}
                className="flex h-10 w-full rounded-control border border-input bg-card px-3 py-2 text-sm shadow-elevation-1 transition hover:border-neutral-300 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20"
              >
                {(filtro.opciones ?? []).map((opcion) => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="relative">
                {filtro.tipo !== "fecha" && (
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                )}
                <Input
                  id={`f-${filtro.name}`}
                  type={filtro.tipo === "fecha" ? "date" : "text"}
                  placeholder={filtro.placeholder}
                  className={filtro.tipo === "fecha" ? "" : "pl-9"}
                  value={valores[filtro.name] ?? ""}
                  onChange={(e) => setValores((v) => ({ ...v, [filtro.name]: e.target.value }))}
                />
              </div>
            )}
          </div>
        ))}
        <div className="flex items-end gap-2">
          <Button type="submit" className="flex-1">
            <SlidersHorizontal className="h-4 w-4" /> Filtrar
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={limpiar} disabled={!hayFiltros} title="Limpiar filtros">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </form>
  );
}
