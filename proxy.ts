import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, REFRESH_COOKIE } from "@/lib/session";

const publicRoutes = ["/login", "/registro", "/partidos", "/posiciones"];

// Comprobación preliminar. La sesión real se consulta en el backend.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/partidos/");

  const hasSession =
    Boolean(request.cookies.get(SESSION_COOKIE)?.value) ||
    Boolean(request.cookies.get(REFRESH_COOKIE)?.value);

  if (!isPublicRoute && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
