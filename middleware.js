import { NextResponse } from "next/server";

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  const authToken = await request.cookies.get("auth_token")?.value;

  // Crear la respuesta base
  const response = NextResponse.next();

  // Configurar headers CORS para todas las respuestas
  response.headers.set("Access-Control-Allow-Origin", "*"); // O 'https://sistemas-casaluongo.com.ar'
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version"
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");

  // Manejar solicitudes OPTIONS (preflight)
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: response.headers,
    });
  }

  const isStaticAsset =
    path.startsWith("/favicon.ico") ||
    path.startsWith("/_next") ||
    path.startsWith("/images") ||
    path.endsWith(".png") ||
    path.endsWith(".jpg") ||
    path.endsWith(".svg") ||
    path.endsWith(".ico");

  // Si es un activo estático, permitir el acceso sin verificar autenticación
  if (isStaticAsset) {
    return response;
  }

  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!authToken && !isLoginPage) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (authToken && isLoginPage) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
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
