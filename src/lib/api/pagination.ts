/** page desde 1; pageSize por defecto 20 y máximo 100 (sección 11.1). */
export function getPagination(query: URLSearchParams) {
  const rawPage = Number(query.get("page") ?? 1);
  const rawSize = Number(query.get("pageSize") ?? 20);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const pageSize = Number.isInteger(rawSize) && rawSize > 0 ? Math.min(rawSize, 100) : 20;
  return { page, pageSize, offset: (page - 1) * pageSize, limit: pageSize };
}

/** Convierte los query params a un objeto plano para los esquemas de Zod. */
export function queryObject(query: URLSearchParams): Record<string, string> {
  return Object.fromEntries(query.entries());
}

export function boolParam(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  return value === "true" || value === "1";
}

export function intParam(value: string | null): number | undefined {
  if (value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}
