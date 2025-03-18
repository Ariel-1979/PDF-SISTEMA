import { NextResponse } from "next/server"
import mysql from "mysql2/promise"

export async function POST() {
  try {
    // Configuración de la conexión a la base de datos
    const dbConfig = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    }

    // Crear conexión
    const connection = await mysql.createConnection(dbConfig)

    // Obtener el año actual
    const currentYear = new Date().getFullYear()

    // Buscar pedidos con fechas de entrega en años futuros
    const [pedidosConFechasFuturas] = await connection.execute(
      `
      SELECT id, fecha_entrega 
      FROM presupuestos 
      WHERE YEAR(fecha_entrega) > ?
    `,
      [currentYear],
    )

    console.log(`Encontrados ${pedidosConFechasFuturas.length} pedidos con fechas futuras`)

    // Corregir las fechas de entrega
    for (const pedido of pedidosConFechasFuturas) {
      const fechaOriginal = new Date(pedido.fecha_entrega)

      // Crear una nueva fecha con el año actual pero manteniendo mes y día
      const fechaCorregida = new Date(currentYear, fechaOriginal.getMonth(), fechaOriginal.getDate())

      console.log(`Corrigiendo pedido ${pedido.id}: ${fechaOriginal.toISOString()} -> ${fechaCorregida.toISOString()}`)

      // Actualizar la fecha en la base de datos
      await connection.execute(
        `
        UPDATE presupuestos 
        SET fecha_entrega = ? 
        WHERE id = ?
      `,
        [fechaCorregida, pedido.id],
      )
    }

    // Cerrar conexión
    await connection.end()

    return NextResponse.json({
      message: "Fechas corregidas correctamente",
      pedidosCorregidos: pedidosConFechasFuturas.length,
    })
  } catch (error) {
    console.error("Error al corregir fechas:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

