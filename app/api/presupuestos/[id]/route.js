import { NextResponse } from "next/server";
import {
  getPresupuestoById,
  updatePresupuesto,
  deletePresupuesto,
} from "@/lib/db";
import { parse } from "path";

export async function GET(request, { params }) {
  try {
    // Convertir el ID a número para asegurarnos de que se usa correctamente
    const { id } = await params;

    const presupuesto = await getPresupuestoById(parseInt(id, 10));

    if (!presupuesto) {
      return NextResponse.json(
        { error: "Presupuesto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(presupuesto);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const result = await updatePresupuesto(parseInt(id, 10), data);

    if (!result) {
      return NextResponse.json(
        { error: "Presupuesto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error en API PUT /presupuestos/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const result = await deletePresupuesto(parseInt(id, 10));

    if (!result) {
      return NextResponse.json(
        { error: "Presupuesto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Presupuesto eliminado correctamente",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
