import { NextResponse } from "next/server";
import {
  createPresupuesto,
  getAllPresupuestos,
  searchPresupuestos,
} from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const limit = searchParams.get("limit")
    ? Number.parseInt(searchParams.get("limit"))
    : null;

  try {
    if (query) {
      console.log("Buscando presupuestos con query:", query);
      const presupuestos = await searchPresupuestos(query);
      return NextResponse.json(presupuestos);
    } else {
      const presupuestos = await getAllPresupuestos(limit);
      return NextResponse.json(presupuestos);
    }
  } catch (error) {
    console.error("Error en API GET /presupuestos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();

    if (!data.cliente) {
      return NextResponse.json(
        { error: "Datos de cliente no proporcionados" },
        { status: 400 }
      );
    }

    if (!Array.isArray(data.productos) || data.productos.length === 0) {
      return NextResponse.json(
        { error: "Lista de productos inválida o vacía" },
        { status: 400 }
      );
    }

    const result = await createPresupuesto(data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error en API POST /presupuestos:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
