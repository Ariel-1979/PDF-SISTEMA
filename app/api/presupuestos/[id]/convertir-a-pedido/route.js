import { NextResponse } from "next/server";
import { convertirPresupuestoAPedido } from "@/lib/db";

export async function POST(request, context) {
  try {
    // Convertir el ID a número para asegurarnos de que se usa correctamente
    const id = Number.parseInt(context.params.id, 10);

    const data = await request.json();
    const { estado_pago, monto_restante, fecha_entrega } = data;
    const result = await convertirPresupuestoAPedido(
      id,
      estado_pago,
      monto_restante,
      fecha_entrega
    );

    if (!result) {
      return NextResponse.json(
        { error: "Presupuesto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
