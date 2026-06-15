import { NextResponse, type NextRequest } from "next/server";

async function expectedSessionToken() {
  const login = process.env.APP_LOGIN ?? "";
  const password = process.env.APP_PASSWORD ?? "";
  const secret = process.env.AUTH_SECRET ?? "";
  const data = new TextEncoder().encode(`${login}:${password}:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(request: NextRequest) {
  if (!process.env.APP_PASSWORD) return NextResponse.next();

  const isLoginPage = request.nextUrl.pathname === "/entrar";
  const token = request.cookies.get("estuda2_session")?.value;
  const isAuthenticated = token === (await expectedSessionToken());

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
