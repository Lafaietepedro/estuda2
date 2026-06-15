import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === "/entrar";
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isAuthenticated = Boolean(await verifySessionToken(token));

  if (!isAuthenticated && !isLoginPage) {
    return NextResponse.redirect(new URL("/entrar", request.url));
  }

  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
