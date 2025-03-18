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

    // Verificar si las columnas ya existen
    const [columns] = await connection.execute(
      `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'presupuestos' AND COLUMN_NAME IN ('subtotal', 'iva_monto', 'iva_porcentaje')
    `,
      [process.env.DB_NAME],
    )

    const existingColumns = columns.map((col) => col.COLUMN_NAME)

    // Agregar columnas faltantes
    if (!existingColumns.includes("subtotal")) {
      await connection.execute(`
        ALTER TABLE presupuestos 
        ADD COLUMN subtotal DECIMAL(10, 2) NOT NULL AFTER cliente_id
      `)
    }

    if (!existingColumns.includes("iva_monto")) {
      await connection.execute(`
        ALTER TABLE presupuestos 
        ADD COLUMN iva_monto DECIMAL(10, 2) DEFAULT 0 AFTER subtotal
      `)
    }

    if (!existingColumns.includes("iva_porcentaje")) {
      await connection.execute(`
        ALTER TABLE presupuestos 
        ADD COLUMN iva_porcentaje VARCHAR(10) NOT NULL AFTER total
      `)
    }

    // Actualizar registros existentes
    await connection.execute(`
      UPDATE presupuestos SET 
      subtotal = total,
      iva_porcentaje = '0%'
      WHERE iva_porcentaje IS NULL OR iva_porcentaje = ''
    `)

    // Cerrar conexión
    await connection.end()

    return NextResponse.json({ message: "Base de datos actualizada correctamente" })
  } catch (error) {
    console.error("Error al actualizar la base de datos:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

