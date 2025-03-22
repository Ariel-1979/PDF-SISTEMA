require("dotenv").config({ path: ".env.production" });
const express = require("express");
const next = require("next");
const path = require("path");

// Determinar si estamos en desarrollo o producción
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// En servidores compartidos, el puerto suele ser proporcionado por el entorno
// o puede ser un puerto específico asignado por el proveedor
const port = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = express();

  // Servir archivos estáticos desde la carpeta public
  server.use(express.static(path.join(__dirname, "public")));

  // Configurar encabezados básicos de seguridad
  server.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("X-Frame-Options", "DENY");
    next();
  });

  // Manejar todas las solicitudes con Next.js
  server.all("*", (req, res) => {
    return handle(req, res);
  });

  // Iniciar el servidor
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Servidor listo en http://localhost:${port}`);
  });
});
