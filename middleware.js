import { NextResponse } from "next/server"
import { verify } from "jsonwebtoken"

// Rutas que no requieren autenticación
const publicRoutes = ["/", "/_next", "/favicon.ico", "/Logo_Luongo.png"]

// Rutas que requieren rol de administrador
const adminRoutes = ["/admin"]

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Verificar si estamos en modo de desarrollo o preview
  const isDevOrPreview = process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview"

  // En desarrollo o preview, permitir todas las rutas
  if (isDevOrPreview) {
    return NextResponse.next()
  }

  // Permitir acceso a rutas públicas
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Verificar token de autenticación
  const token = request.cookies.get("auth_token")?.value

  if (!token) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  try {
    // Verificar y decodificar el token
    const decoded = verify(token, process.env.JWT_SECRET || "your-secret-key")

    // Verificar permisos para rutas de administrador
    if (adminRoutes.some((route) => pathname.startsWith(route)) && decoded.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url))
    }

    return NextResponse.next()
  } catch (error) {
    // Token inválido o expirado
    return NextResponse.redirect(new URL("/", request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Excluir archivos estáticos y API routes
     * /_next/static, /_next/image, /favicon.ico, /api/auth/login, /api/auth/logout
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth/login|api/auth/logout).*)",
  ],
}

