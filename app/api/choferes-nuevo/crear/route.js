import { NextResponse } from "next/server"
import { createChofer } from "@/lib/db"

export async function POST(request) {
  try {
    const data = await request.json()
    const result = await createChofer(data.nombre)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

