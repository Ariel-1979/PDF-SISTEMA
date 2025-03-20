import { NextResponse } from "next/server"
import { getAllChoferes } from "@/lib/db"

export async function GET() {
  try {
    const choferes = await getAllChoferes()
    return NextResponse.json(choferes)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

