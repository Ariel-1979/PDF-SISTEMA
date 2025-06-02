import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function DELETE(request) {
  try {
    const data = await request.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json({ error: "Se requiere ID" }, { status: 400 });
    }

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
    console.error("Error en API DELETE /choferes/eliminar:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
