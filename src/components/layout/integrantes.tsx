"use client";

import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Integrantes del grupo y sus legajos (mismos datos que el README). */
const INTEGRANTES = [
  { legajo: "61087", nombre: "Pérez Joaquín" },
  { legajo: "61175", nombre: "Risso Aaron Ezequiel" },
  { legajo: "55656", nombre: "Lombardo Ríos Benjamín" },
] as const;

/**
 * Integrantes en la barra superior, visibles en todas las pantallas del panel.
 * Desde md: lista compacta de tres renglones. En celulares: botón con menú desplegable.
 */
export function Integrantes() {
  return (
    <>
      <ul aria-label="Integrantes" className="hidden border-r border-border/70 pr-3 text-[11px] leading-4 md:block">
        {INTEGRANTES.map((i) => (
          <li key={i.legajo} className="flex items-baseline justify-between gap-3">
            <span className="font-medium">{i.nombre}</span>
            <span className="font-mono tabular-nums text-muted-foreground">{i.legajo}</span>
          </li>
        ))}
      </ul>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Users className="h-5 w-5" />
            <span className="sr-only">Ver integrantes</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Integrantes</DropdownMenuLabel>
          {INTEGRANTES.map((i) => (
            <DropdownMenuItem key={i.legajo} className="justify-between">
              <span>{i.nombre}</span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">{i.legajo}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
