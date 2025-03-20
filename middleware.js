import { NextResponse } from "next/server";

export function middleware(request) {
  // Obtener la cookie de autenticación
  const authToken = request.cookies.get("auth_token")?.value;

  // Verificar si la ruta actual es la página de login
  const isLoginPage = request.nextUrl.pathname === "/login";

  // Si el usuario no está autenticado y no está en la página de login, redirigir a login
  if (!authToken && !isLoginPage) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Si el usuario está autenticado y está en la página de login, redirigir al panel principal
  if (authToken && isLoginPage) {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  // Permitir la solicitud para todas las demás rutas
  return NextResponse.next();
}

// Configurar las rutas que deben ser protegidas por el middleware
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
