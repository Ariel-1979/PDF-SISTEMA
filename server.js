// server.js
require("dotenv").config({ path: ".env.production" });

const express = require("express");
const next = require("next");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const port = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = express();

  // Servir archivos estáticos de /public
  server.use(express.static(path.join(__dirname, "public")));

  // Encabezados básicos de seguridad
  server.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("X-Frame-Options", "DENY");
    next();
  });

  // Ruta para debug (opcional)
  server.get("/debug/env", (req, res) => {
    res.json({
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD,
      DB_NAME: process.env.DB_NAME,
    });
  });

  // Ruta para webhook de GitHub
  server.post("/webhook", express.json(), (req, res) => {
    const { headers } = req;

    // Verificás si viene desde GitHub (opcionalmente podés validar una secret)
    if (headers["user-agent"].includes("GitHub-Hookshot")) {
      const exec = require("child_process").exec;
      exec("bash ./deploy.sh", (err, stdout, stderr) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Error al ejecutar deploy");
        }
        console.log(stdout);
        res.status(200).send("Deploy ejecutado");
      });
    } else {
      res.status(403).send("Forbidden");
    }
  });

  // Delegar manejo de rutas a Next.js
  server.all("*", (req, res) => {
    return handle(req, res);
  });

  // Iniciar servidor
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Servidor listo en http://localhost:${port}`);
  });
});
