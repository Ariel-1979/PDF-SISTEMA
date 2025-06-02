import { NextResponse } from "next/server";
import { actualizarEstadoPedido } from "@/lib/db";

export async function PUT(request, context) {
  try {
    // Convertir el ID a número para asegurarnos de que se usa correctamente
    const id = Number.parseInt(context.params.id, 10);

    const data = await request.json();

    const result = await actualizarEstadoPedido(id, data);

    if (!result) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error en API PUT /pedidos/[id]/actualizar-estado:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
