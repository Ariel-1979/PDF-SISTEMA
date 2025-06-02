import { NextResponse } from "next/server";
import { getPedidoById, updatePedido, deletePedido } from "@/lib/db";
import { parse } from "path";

export async function GET(request, context) {
  try {
    const { id } = await params;

    const pedido = await getPedidoById(parseInt(id, 10));

    if (!pedido) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(pedido);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    // Convertir el ID a número para asegurarnos de que se usa correctamente
    const id = Number.parseInt(context.params.id, 10);

    const data = await request.json();

    const result = await updatePedido(id, data);

    if (!result) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error en API PUT /pedidos/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
  try {
    // Convertir el ID a número para asegurarnos de que se usa correctamente
    const id = Number.parseInt(context.params.id, 10);

    const result = await deletePedido(id);

    if (!result) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Pedido eliminado correctamente" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
