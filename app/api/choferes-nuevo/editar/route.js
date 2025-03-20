import { NextResponse } from "next/server"
import { updateChofer } from "@/lib/db"

export async function PUT(request) {
  try {
    const data = await request.json()
    const { id, nombre } = data

    if (!id || !nombre) {
      return NextResponse.json({ error: "Se requiere ID y nombre" }, { status: 400 })
    }

    const result = await updateChofer(id, nombre)

    if (!result) {
      return NextResponse.json({ error: "Chofer no encontrado" }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

