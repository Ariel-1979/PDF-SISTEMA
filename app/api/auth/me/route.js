import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
  try {
    // Obtener el token de la cookie
    const cookieStore = cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar el token
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      );

      // Devolver la información del usuario
      return NextResponse.json({
        user: {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        },
      });
    } catch (jwtError) {
      console.error("Error al verificar token:", jwtError);
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return NextResponse.json(
      { error: "Error al obtener usuario" },
      { status: 500 }
    );
  }
}
