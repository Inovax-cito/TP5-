import { NextResponse } from "next/server";
import { aErrorPublico } from "@/lib/errors";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function paginated<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number,
  extra: Record<string, unknown> = {},
) {
  return NextResponse.json({ data, page, pageSize, total, ...extra });
}

/** Un servicio devuelve el paginado completo; el adaptador solo lo serializa. */
export function fromPaginated<T>(result: {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  [key: string]: unknown;
}) {
  const { data, page, pageSize, total, ...extra } = result;
  return paginated(data, page, pageSize, total, extra);
}

/** Sección 11.1: un único formato de error para toda la API. */
export function errorResponse(error: unknown) {
  const { status, error: cuerpo } = aErrorPublico(error);
  return NextResponse.json({ error: cuerpo }, { status });
}
