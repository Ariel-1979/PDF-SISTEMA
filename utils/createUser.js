// Este archivo es solo para referencia, no se incluye en la aplicación
// Puedes usarlo para crear usuarios manualmente desde la consola

const bcrypt = require("bcrypt")
const mysql = require("mysql2/promise")

async function createUser(email, password, nombre, role = "user") {
  // Configuración de la conexión a la base de datos
  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  }

  // Encriptar contraseña
  const hashedPassword = await bcrypt.hash(password, 10)

  // Crear conexión
  const connection = await mysql.createConnection(dbConfig)

  try {
    // Insertar usuario
    const [result] = await connection.execute(
      "INSERT INTO usuarios (email, password, nombre, role) VALUES (?, ?, ?, ?)",
      [email, hashedPassword, nombre, role],
    )

    console.log(`Usuario creado con ID: ${result.insertId}`)
    return result.insertId
  } catch (error) {
    console.error("Error al crear usuario:", error)
    throw error
  } finally {
    await connection.end()
  }
}

// Ejemplo de uso:
// createUser('admin@example.com', 'password123', 'Administrador', 'admin')
//   .then(() => console.log('Usuario administrador creado'))
//   .catch(console.error);

// createUser('user@example.com', 'password123', 'Usuario Normal')
//   .then(() => console.log('Usuario normal creado'))
//   .catch(console.error);

