"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Selector de tema en la barra superior: claro, oscuro o el del sistema. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-foreground">
          <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-micro uppercase text-muted-foreground">Tema</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={montado ? (theme ?? "system") : "system"} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light"><Sun /> Claro</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark"><Moon /> Oscuro</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system"><Monitor /> Sistema</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
