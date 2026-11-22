import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina clases de Tailwind resolviendo conflictos (RF - interfaz consistente). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "Laura Méndez" -> "LM" (avatar del usuario o del cliente). */
export function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");
}
