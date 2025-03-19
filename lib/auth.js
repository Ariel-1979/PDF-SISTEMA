import mysql from "mysql2/promise"
import { verify } from "jsonwebtoken"
import { cookies } from "next/headers"

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

// Obtener usuario por email
export async function getUserByEmail(email) {
  const connection = await mysql.createConnection(dbConfig)

  try {
    const [rows] = await connection.execute("SELECT * FROM usuarios WHERE email = ?", [email])

    return rows.length > 0 ? rows[0] : null
  } finally {
    await connection.end()
  }
}

// Verificar token JWT y obtener usuario
export async function getAuthUser() {
  const cookieStore = cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) {
    return null
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET || "your-secret-key")
    return decoded
  } catch (error) {
    console.error("Error al verificar token:", error)
    return null
  }
}

// Middleware para verificar autenticación
export async function requireAuth(request) {
  const user = await getAuthUser()

  if (!user) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    }
  }

  return { props: { user } }
}

// Middleware para verificar rol de administrador
export async function requireAdmin(request) {
  const user = await getAuthUser()

  if (!user) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    }
  }

  if (user.role !== "admin") {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    }
  }

  return { props: { user } }
}

