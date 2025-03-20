import { NextResponse } from "next/server";
import { updateChofer, deleteChofer } from "@/lib/db";

export async function PUT(request, context) {
  try {
    // Esperar los parámetros antes de desestructurarlos
    const params = await context.params;
    const { id } = params;

    const data = await request.json();
    const { nombre } = data;

    if (!nombre) {
      return NextResponse.json(
        { error: "Se requiere nombre" },
        { status: 400 }
      );
    }

    const result = await updateChofer(id, nombre);

    if (!result) {
      return NextResponse.json(
        { error: "Chofer no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error en API PUT /choferes/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    // Esperar los parámetros antes de desestructurarlos
    const params = await context.params;
    const { id } = params;

    console.log("API: Eliminando chofer con ID:", id);

    // Verificar que la función deleteChofer existe
    if (typeof deleteChofer !== "function") {
      console.error("La función deleteChofer no está definida");
      return NextResponse.json(
        {
          error:
            "Error interno del servidor: función de eliminación no disponible",
        },
        { status: 500 }
      );
    }

    const result = await deleteChofer(id);

    if (!result) {
      return NextResponse.json(
        { error: "Chofer no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Chofer eliminado correctamente" });
  } catch (error) {
    console.error("Error en API DELETE /choferes/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
