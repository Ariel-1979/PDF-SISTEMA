import { NextResponse } from "next/server"
import { getPedidosByChofer } from "@/lib/db"

export async function GET(request, context) {
  try {
    // Usar desestructuración para obtener el nombre
    const { nombre } = context.params
    const pedidos = await getPedidosByChofer(nombre)
    return NextResponse.json(pedidos)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

