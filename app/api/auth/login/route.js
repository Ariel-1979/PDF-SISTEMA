import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config({ path: ".env.production" });

console.log(process.env.DB_USER, "USUARIO BD");

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Conectar a la base de datos
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    try {
      // Buscar el usuario por email
      const [users] = await connection.execute(
        "SELECT * FROM usuarios WHERE email = ?",
        [email]
      );

      await connection.end();

      // Verificar si el usuario existe
      if (users.length === 0) {
        return NextResponse.json(
          { error: "Credenciales inválidas" },
          { status: 401 }
        );
      }

      const user = users[0];

      // Verificar la contraseña
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return NextResponse.json(
          { error: "Credenciales inválidas" },
          { status: 401 }
        );
      }

      // Generar token JWT
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
      );

      // Crear objeto de respuesta
      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          role: user.role,
        },
      });

      // Establecer cookie con el token - CORREGIDO PARA USAR AWAIT
      const cookieStore = cookies();
      await cookieStore.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 8, // 8 horas
        path: "/",
      });

      return response;
    } catch (dbError) {
      console.error("Error en la base de datos:", dbError);
      return NextResponse.json(
        { error: "Error al iniciar sesión" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
