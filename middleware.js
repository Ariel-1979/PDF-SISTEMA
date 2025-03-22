import { NextResponse } from "next/server";

export async function middleware(request) {
  const authToken = await request.cookies.get("auth_token")?.value;

  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!authToken && !isLoginPage) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (authToken && isLoginPage) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto:
     * 1. /api/auth/* (rutas de autenticación)
     * 2. /_next/* (archivos estáticos de Next.js)
     * 3. /favicon.ico, /sitemap.xml, /robots.txt (archivos comunes)
     */
    "/((?!api/auth|_next|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
