import { NextResponse } from "next/server";
import { getPedidosProgramados } from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const fechaDesde = searchParams.get("fechaDesde");

  try {
    const pedidos = await getPedidosProgramados(fechaDesde);
    return NextResponse.json(pedidos);
  } catch (error) {
    console.error("Error en API GET /pedidos/programados:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
