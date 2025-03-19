import { NextResponse } from "next/server"
import { compare } from "bcrypt"
import { sign } from "jsonwebtoken"
import { cookies } from "next/headers"
import { getUserByEmail } from "@/lib/auth"

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    // Validar datos de entrada
    if (!email || !password) {
      return NextResponse.json({ error: "Correo y contraseña son requeridos" }, { status: 400 })
    }

    // Verificar si estamos en modo de desarrollo o preview
    const isDevOrPreview = process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview"

    // En desarrollo o preview, permitir un login de prueba
    if (isDevOrPreview && email === "test@example.com" && password === "password") {
      const token = sign(
        {
          id: 999,
          email: "test@example.com",
          role: "admin",
          name: "Usuario de Prueba",
        },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "8h" },
      )

      // Establecer cookie con el token
      const cookieStore = cookies()
      cookieStore.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 8, // 8 horas
        path: "/",
      })

      // Devolver respuesta exitosa
      return NextResponse.json({
        success: true,
        user: {
          id: 999,
          email: "test@example.com",
          name: "Usuario de Prueba",
          role: "admin",
        },
      })
    }

    // Buscar usuario por email
    const user = await getUserByEmail(email)

    if (!user) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    // Verificar contraseña
    const passwordMatch = await compare(password, user.password)

    if (!passwordMatch) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    // Crear token JWT
    const token = sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.nombre,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "8h" },
    )

    // Establecer cookie con el token
    const cookieStore = cookies()
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 8, // 8 horas
      path: "/",
    })

    // Devolver respuesta exitosa
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.nombre,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json({ error: "Error interno del servidor: " + error.message }, { status: 500 })
  }
}

