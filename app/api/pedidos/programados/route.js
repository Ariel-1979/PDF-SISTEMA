import { NextResponse } from "next/server"
import { getPedidosProgramados } from "@/lib/db"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const fechaDesde = searchParams.get("fechaDesde")

  console.log("API pedidos/programados - fechaDesde recibida:", fechaDesde)

  try {
    const pedidos = await getPedidosProgramados(fechaDesde)

    // Imprimir los resultados para depuración
    console.log("API pedidos/programados - pedidos obtenidos:", pedidos.length)
    if (pedidos.length > 0) {
      console.log(
        "API pedidos/programados - ejemplo de fecha_entrega:",
        pedidos[0].fecha_entrega,
        "tipo:",
        typeof pedidos[0].fecha_entrega,
      )
    }

    return NextResponse.json(pedidos)
  } catch (error) {
    console.error("Error en API GET /pedidos/programados:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

