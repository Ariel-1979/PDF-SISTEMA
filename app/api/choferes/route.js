import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function GET() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    try {
      const [rows] = await connection.execute(`
        SELECT id, nombre
        FROM choferes
        ORDER BY nombre ASC
      `);

      await connection.end();

      return NextResponse.json(rows);
    } catch (dbError) {
      await connection.end();
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { nombre } = data;

    if (!nombre) {
      return NextResponse.json(
        { error: "Se requiere nombre" },
        { status: 400 }
      );
    }

    // Crear conexión a la base de datos
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    try {
      // Insertar el chofer directamente con SQL - solo el campo nombre
      const [result] = await connection.execute(
        "INSERT INTO choferes (nombre) VALUES (?)",
        [nombre]
      );

      await connection.end();

      return NextResponse.json(
        {
          id: result.insertId,
          nombre,
          message: "Chofer creado correctamente",
        },
        { status: 201 }
      );
    } catch (dbError) {
      await connection.end();
      console.error("Error al crear chofer en la base de datos:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
  } catch (error) {
    console.error("Error en API POST /choferes:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
