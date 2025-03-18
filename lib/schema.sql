-- Crear base de datos
CREATE DATABASE IF NOT EXISTS casa_luongo;
USE casa_luongo;

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  domicilio VARCHAR(255),
  entre_calles VARCHAR(255),
  telefono VARCHAR(50),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de presupuestos/pedidos
CREATE TABLE IF NOT EXISTS presupuestos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero VARCHAR(20) NOT NULL,
  cliente_id INT NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  iva_monto DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  iva_porcentaje VARCHAR(10) NOT NULL,
  estado ENUM('presupuesto', 'pedido') NOT NULL DEFAULT 'presupuesto',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_conversion TIMESTAMP NULL,
  estado_pago ENUM('abonado', 'a_pagar', 'resta_abonar') DEFAULT 'a_pagar',
  monto_restante DECIMAL(10, 2) DEFAULT 0,
  estado_entrega ENUM('pendiente', 'entregado') DEFAULT 'pendiente',
  chofer VARCHAR(255) NULL,
  fecha_entrega DATE NULL,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- Tabla de productos en presupuestos
CREATE TABLE IF NOT EXISTS presupuesto_productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  presupuesto_id INT NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id)
);

-- Índices para búsquedas
CREATE INDEX idx_presupuestos_estado ON presupuestos(estado);
CREATE INDEX idx_presupuestos_numero ON presupuestos(numero);
CREATE INDEX idx_clientes_nombre ON clientes(nombre);

-- Crear tabla de choferes si no existe
CREATE TABLE IF NOT EXISTS choferes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

