/**
 * Formatos locales centralizados (sección 10.6 y regla 10).
 * Argentina no tiene horario de verano desde 2010: offset fijo -03:00.
 */
export const ARG_TZ = "America/Argentina/Buenos_Aires";
export const ARG_OFFSET = "-03:00";

const numberFormatter = new Intl.NumberFormat("es-AR");

/** 1250000 -> "$ 12.500,00". Los importes siempre llegan en centavos. */
export function formatMoney(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.trunc(cents));
  const pesos = Math.floor(abs / 100);
  const centavos = abs % 100;
  return `${sign}$ ${numberFormatter.format(pesos)},${String(centavos).padStart(2, "0")}`;
}

/** 1250000 -> "12.500,00" (sin símbolo, útil dentro de inputs). */
export function formatAmount(cents: number): string {
  const abs = Math.abs(Math.trunc(cents));
  return `${numberFormatter.format(Math.floor(abs / 100))},${String(abs % 100).padStart(2, "0")}`;
}

/** "12.500,50" -> 1250050 (centavos). Acepta puntos y comas. */
export function parseAmount(value: string): number | null {
  const clean = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  if (!clean || !/^\d+(\.\d{0,2})?$/.test(clean)) return null;
  const [pesos, centavos = ""] = clean.split(".");
  return Number(pesos) * 100 + Number(centavos.padEnd(2, "0"));
}

/** Fecha ISO -> dd/mm/aaaa en hora Argentina. */
export function formatDate(iso: string | Date | null | undefined): string {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: ARG_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

/** Fecha ISO -> dd/mm/aaaa hh:mm en hora Argentina. */
export function formatDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: ARG_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/** "2026-10-29T18:24:00Z" -> "29/10/2026 18:24" (huso explícito). */
export function formatDateTimeArg(iso: string | Date | null | undefined): string {
  return formatDateTime(iso).replace(",", "");
}

/** Fecha de hoy en Argentina, en formato AAAA-MM-DD. */
export function todayArg(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ARG_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Primer día del mes en curso, en Argentina. */
export function monthStartArg(): string {
  return `${todayArg().slice(0, 7)}-01`;
}

/** Desplaza una fecha AAAA-MM-DD una cantidad de días. */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/** Últimos n días (incluido hoy), del más viejo al más nuevo. */
export function lastDays(n: number): string[] {
  const today = todayArg();
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));
}

/** Límites UTC de un día AAAA-MM-DD interpretado en hora Argentina. */
export function dayBoundsArg(dateStr: string): { desde: Date; hasta: Date } {
  return {
    desde: new Date(`${dateStr}T00:00:00.000${ARG_OFFSET}`),
    hasta: new Date(`${dateStr}T23:59:59.999${ARG_OFFSET}`),
  };
}

/** Inicio del mes en UTC (Argentina) y ahora. */
export function monthBoundsArg(): { desde: Date; hasta: Date } {
  return {
    desde: new Date(`${monthStartArg()}T00:00:00.000${ARG_OFFSET}`),
    hasta: new Date(),
  };
}

/** Regla 4: 0001-00000001 (punto de venta y número). */
export function formatNumero(puntoVenta: number, numero: number): string {
  return `${String(puntoVenta).padStart(4, "0")}-${String(numero).padStart(8, "0")}`;
}

export function formatRecibo(puntoVenta: number, numero: number): string {
  return `R ${formatNumero(puntoVenta, numero)}`;
}

/** Normaliza un documento para buscarlo sin importar puntos ni guiones. */
export function normalizeDoc(value: string): string {
  return value.replace(/[.\-\s]/g, "").toLowerCase();
}
