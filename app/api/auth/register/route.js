import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

export async function POST(request) {
  try {
    const { email, password, nombre, role } = await request.json();

    // Validaciones básicas
    if (!email || !password) {
      return NextResponse.json(
        {
          error: "Email y contraseña son requeridos",
        },
        { status: 400 }
      );
    }

    // Hashear la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear conexión a la base de datos
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    try {
      // Verificar si el usuario ya existe
      const [existingUsers] = await connection.execute(
        "SELECT id FROM usuarios WHERE email = ?",
        [email]
      );

      if (existingUsers.length > 0) {
        await connection.end();
        return NextResponse.json(
          {
            error: "El usuario con este email ya existe",
          },
          { status: 400 }
        );
      }

      // Insertar el usuario
      const [result] = await connection.execute(
        "INSERT INTO usuarios (email, password, nombre, role) VALUES (?, ?, ?, ?)",
        [email, hashedPassword, nombre || email.split("@")[0], role || "user"]
      );

      await connection.end();

      return NextResponse.json(
        {
          success: true,
          userId: result.insertId,
          message: "Usuario registrado correctamente",
        },
        { status: 201 }
      );
    } catch (dbError) {
      await connection.end();
      console.error("Error en la base de datos:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
