import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/token";

/**
 * RF-U2 — Barrera 1 de 3: redirige al login si falta la cookie firmada.
 * Las páginas vuelven a resolver el usuario en BD y los servicios verifican el rol.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const esPublico = pathname === "/login" || pathname === "/api/auth/login";

  if (esPublico) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const userId = token ? await verifySessionToken(token) : null;

  if (!userId) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: { code: "NO_AUTENTICADO", message: "Iniciá sesión para continuar." } },
        { status: 401 },
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
