import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function PUT(request, context) {
  try {
    // Esperar los parámetros antes de desestructurarlos
    const params = await context.params;
    const { id } = params;

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
      // Actualizar el chofer directamente con SQL
      const [result] = await connection.execute(
        "UPDATE choferes SET nombre = ? WHERE id = ?",
        [nombre, id]
      );

      await connection.end();

      if (result.affectedRows === 0) {
        return NextResponse.json(
          { error: "Chofer no encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        id,
        nombre,
        message: "Chofer actualizado correctamente",
      });
    } catch (dbError) {
      await connection.end();
      console.error("Error en la base de datos:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
  } catch (error) {
    console.error("Error en API PUT /choferes/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    // Esperar los parámetros antes de desestructurarlos
    const params = await context.params;
    const { id } = params;

    // Crear conexión a la base de datos
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    try {
      // Eliminar el chofer directamente con SQL
      const [result] = await connection.execute(
        "DELETE FROM choferes WHERE id = ?",
        [id]
      );

      await connection.end();

      if (result.affectedRows === 0) {
        return NextResponse.json(
          { error: "Chofer no encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json({ message: "Chofer eliminado correctamente" });
    } catch (dbError) {
      await connection.end();
      console.error("Error al eliminar chofer en la base de datos:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
  } catch (error) {
    console.error("Error en API DELETE /choferes/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
