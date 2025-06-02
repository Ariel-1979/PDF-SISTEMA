import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const nombre = searchParams.get("nombre");

  try {
    if (!nombre) {
      return NextResponse.json(
        { error: "Se requiere el parámetro nombre" },
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
      // Consulta SQL que usa la tabla presupuestos en lugar de pedidos
      const [rows] = await connection.execute(
        `
        SELECT p.*, c.domicilio as cliente_domicilio, c.nombre as cliente_nombre
        FROM presupuestos p
        JOIN choferes ch ON p.chofer = ch.nombre
        LEFT JOIN clientes c ON p.cliente_id = c.id
        WHERE ch.nombre = ?
      `,
        [nombre]
      );

      await connection.end();

      return NextResponse.json(rows);
    } catch (dbError) {
      await connection.end();
      console.error("Error en la consulta de la base de datos:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
  } catch (error) {
    console.error(`API Error en GET /choferes/pedidos:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
