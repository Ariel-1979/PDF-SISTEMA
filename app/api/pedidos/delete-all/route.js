import { NextResponse } from "next/server";
import { deleteAllPedidos } from "@/lib/db";

export async function DELETE() {
  try {
    const result = await deleteAllPedidos();
    return NextResponse.json(
      { success: true, count: result.count },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar todos los pedidos:", error);
    return NextResponse.json(
      { error: "Error al eliminar todos los pedidos" },
      { status: 500 }
    );
  }
}
