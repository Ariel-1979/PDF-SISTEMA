import { NextResponse } from "next/server";
import { deleteChofer } from "@/lib/db";

export async function DELETE(request) {
  try {
    const data = await request.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json({ error: "Se requiere ID" }, { status: 400 });
    }

    console.log("API: Eliminando chofer con ID:", id);

    // Intentar eliminar el chofer usando la función existente
    try {
      const result = await deleteChofer(id);

      if (!result) {
        return NextResponse.json(
          { error: "Chofer no encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json({ message: "Chofer eliminado correctamente" });
    } catch (dbError) {
      console.error("Error al eliminar chofer en la base de datos:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
  } catch (error) {
    console.error("Error en API DELETE /choferes-nuevo/eliminar:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
