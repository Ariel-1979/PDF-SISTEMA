import { NextResponse } from "next/server";
import { getPedidosByFecha } from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const fecha = searchParams.get("fecha");

  try {
    if (!fecha) {
      return NextResponse.json(
        { error: "Se requiere el parámetro fecha" },
        { status: 400 }
      );
    }

    const pedidos = await getPedidosByFecha(fecha);
    return NextResponse.json(pedidos);
  } catch (error) {
    console.error("Error en API GET /pedidos/fecha:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
