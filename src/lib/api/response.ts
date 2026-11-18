import { NextResponse } from "next/server";
import { ApiError } from "@/lib/errors";

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

/** Sección 11.1: un único formato de error para toda la API. */
export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details?.length ? { details: error.details } : {}),
        },
      },
      { status: error.status },
    );
  }

  console.error("[ERROR_INTERNO]", error);
  return NextResponse.json(
    { error: { code: "ERROR_INTERNO", message: "Ocurrió un error inesperado." } },
    { status: 500 },
  );
}
