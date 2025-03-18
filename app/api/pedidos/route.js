import { NextResponse } from "next/server"
import { getAllPedidos, searchPedidos, updatePedido } from "@/lib/db"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")

  try {
    if (query) {
      console.log("Buscando pedidos con query:", query)
      const pedidos = await searchPedidos(query)
      return NextResponse.json(pedidos)
    } else {
      const pedidos = await getAllPedidos()
      return NextResponse.json(pedidos)
    }
  } catch (error) {
    console.error("Error en API GET /pedidos:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const data = await request.json()
    console.log("Datos recibidos para actualizar pedido:", JSON.stringify(data))

    const result = await updatePedido(params.id, data)

    if (!result) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error en API PUT /pedidos:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}

