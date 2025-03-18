import { NextResponse } from "next/server"
import { getPresupuestoById, updatePresupuesto, deletePresupuesto } from "@/lib/db"

export async function GET(request, context) {
  try {
    // Convertir el ID a número para asegurarnos de que se usa correctamente
    const id = Number.parseInt(context.params.id, 10)
    console.log("API GET /presupuestos/[id] - ID recibido:", id)

    const presupuesto = await getPresupuestoById(id)

    if (!presupuesto) {
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 })
    }

    return NextResponse.json(presupuesto)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request, context) {
  try {
    // Convertir el ID a número para asegurarnos de que se usa correctamente
    const id = Number.parseInt(context.params.id, 10)
    console.log("API PUT /presupuestos/[id] - ID recibido:", id)

    const data = await request.json()
    console.log("Datos recibidos para actualizar:", JSON.stringify(data))

    const result = await updatePresupuesto(id, data)

    if (!result) {
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error en API PUT /presupuestos/[id]:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request, context) {
  try {
    // Convertir el ID a número para asegurarnos de que se usa correctamente
    const id = Number.parseInt(context.params.id, 10)
    console.log("API DELETE /presupuestos/[id] - ID recibido:", id)

    const result = await deletePresupuesto(id)

    if (!result) {
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ message: "Presupuesto eliminado correctamente" })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

