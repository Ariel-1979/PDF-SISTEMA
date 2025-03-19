import mysql from "mysql2/promise";

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para ejecutar consultas
async function query(sql, params) {
  const [results] = await pool.execute(sql, params);
  return results;
}

// Funciones para presupuestos
// Modificar la función getAllPresupuestos para aceptar un límite
export async function getAllPresupuestos(limit = null) {
  let sql = `
    SELECT p.*, c.nombre as cliente_nombre 
    FROM presupuestos p
    LEFT JOIN clientes c ON p.cliente_id = c.id
    WHERE p.estado = 'presupuesto'
    ORDER BY p.fecha_creacion DESC
  `;

  if (limit) {
    sql += ` LIMIT ${limit}`;
  }

  return await query(sql);
}

export async function getPresupuestoById(id) {
  console.log("getPresupuestoById - ID recibido:", id);

  // Primero, verificamos si el presupuesto existe con una consulta simple
  const presupuestoCheck = await query(
    `SELECT id FROM presupuestos WHERE id = ?`,
    [id]
  );

  console.log("getPresupuestoById - Verificación inicial:", presupuestoCheck);

  if (presupuestoCheck.length === 0) {
    console.log("getPresupuestoById - Presupuesto no encontrado con ID:", id);
    return null;
  }

  // Ahora hacemos la consulta completa con JOIN, pero sin incluir fecha_entrega
  const presupuestos = await query(
    `
    SELECT 
      p.id, 
      p.numero, 
      p.cliente_id, 
      p.subtotal, 
      p.iva_monto, 
      p.total, 
      p.iva_porcentaje, 
      p.estado, 
      p.fecha_creacion, 
      p.fecha_conversion, 
      p.estado_pago, 
      p.monto_restante, 
      p.estado_entrega, 
      p.chofer, 
      c.id AS cliente_id_original, 
      c.nombre, 
      c.domicilio, 
      c.entre_calles, 
      c.telefono
    FROM presupuestos p
    LEFT JOIN clientes c ON p.cliente_id = c.id
    WHERE p.id = ?
    `,
    [id]
  );

  console.log(
    "getPresupuestoById - Resultados encontrados:",
    presupuestos.length
  );

  if (presupuestos.length === 0) {
    return null;
  }

  const presupuesto = presupuestos[0];
  console.log(
    "getPresupuestoById - ID del presupuesto encontrado:",
    presupuesto.id
  );

  // Obtener los productos del presupuesto
  const productos = await query(
    `
    SELECT * FROM presupuesto_productos
    WHERE presupuesto_id = ?
    `,
    [id]
  );

  return {
    ...presupuesto,
    productos,
  };
}

export async function searchPresupuestos(searchTerm) {
  console.log("Ejecutando búsqueda de presupuestos con query:", searchTerm);

  try {
    // Verificar si la consulta es un número
    const isNumeric = /^\d+$/.test(searchTerm);

    let results;
    if (isNumeric) {
      // Si es un número, buscar por número de presupuesto
      results = await query(
        `
        SELECT p.*, c.nombre as cliente_nombre 
        FROM presupuestos p
        LEFT JOIN clientes c ON p.cliente_id = c.id
        WHERE p.estado = 'presupuesto' AND p.numero LIKE ?
        ORDER BY p.fecha_creacion DESC
      `,
        [`%${searchTerm}%`]
      );
    } else {
      // Si no es un número, buscar por nombre de cliente o dirección
      results = await query(
        `
        SELECT p.*, c.nombre as cliente_nombre 
        FROM presupuestos p
        LEFT JOIN clientes c ON p.cliente_id = c.id
        WHERE p.estado = 'presupuesto' AND (
          c.nombre LIKE ? OR
          c.domicilio LIKE ?
        )
        ORDER BY p.fecha_creacion DESC
      `,
        [`%${searchTerm}%`, `%${searchTerm}%`]
      );
    }

    console.log(
      `Búsqueda completada. Resultados encontrados: ${results.length}`
    );
    return results;
  } catch (error) {
    console.error("Error en searchPresupuestos:", error);
    throw error;
  }
}

// Actualizar la función createPresupuesto para siempre crear un nuevo cliente
export async function createPresupuesto(data) {
  const { cliente, productos, subtotal, iva_monto, total, iva_porcentaje } =
    data;

  // Verificar que productos sea un array
  if (!Array.isArray(productos) || productos.length === 0) {
    throw new Error("La lista de productos es inválida o está vacía");
  }

  // Iniciar transacción
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Siempre crear un nuevo cliente para evitar sobrescribir datos
    const nuevoCliente = await connection.execute(
      "INSERT INTO clientes (nombre, domicilio, entre_calles, telefono) VALUES (?, ?, ?, ?)",
      [cliente.nombre, cliente.domicilio, cliente.entreCalles, cliente.telefono]
    );
    const clienteId = nuevoCliente[0].insertId;

    // Crear presupuesto
    const fechaCreacion = new Date();
    const numero = await generarNumeroPresupuesto();

    const presupuestoResult = await connection.execute(
      "INSERT INTO presupuestos (numero, cliente_id, subtotal, iva_monto, total, iva_porcentaje, estado, fecha_creacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        numero,
        clienteId,
        subtotal,
        iva_monto,
        total,
        iva_porcentaje,
        "presupuesto",
        fechaCreacion,
      ]
    );

    const presupuestoId = presupuestoResult[0].insertId;

    // Insertar productos
    for (const producto of productos) {
      await connection.execute(
        "INSERT INTO presupuesto_productos (presupuesto_id, nombre, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)",
        [
          presupuestoId,
          producto.nombre,
          producto.cantidad,
          producto.precioUnitario,
          producto.subtotal,
        ]
      );
    }

    // Confirmar transacción
    await connection.commit();

    return {
      id: presupuestoId,
      numero,
      cliente_id: clienteId,
      subtotal,
      iva_monto,
      total,
      iva_porcentaje,
      estado: "presupuesto",
      fecha_creacion: fechaCreacion,
    };
  } catch (error) {
    // Revertir transacción en caso de error
    await connection.rollback();
    console.error("Error en createPresupuesto:", error);
    throw error;
  } finally {
    connection.release();
  }
}

// Modificar updatePresupuesto para no actualizar datos de cliente existente
export async function updatePresupuesto(id, data) {
  const { cliente, productos, subtotal, iva_monto, total, iva_porcentaje } =
    data;

  // Iniciar transacción
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Verificar si el presupuesto existe
    const presupuestoExistente = await connection.execute(
      "SELECT id, cliente_id FROM presupuestos WHERE id = ?",
      [id]
    );

    if (presupuestoExistente[0].length === 0) {
      return null;
    }

    const clienteId = presupuestoExistente[0][0].cliente_id;

    // Crear un nuevo cliente en lugar de actualizar el existente
    const nuevoCliente = await connection.execute(
      "INSERT INTO clientes (nombre, domicilio, entre_calles, telefono) VALUES (?, ?, ?, ?)",
      [cliente.nombre, cliente.domicilio, cliente.entreCalles, cliente.telefono]
    );
    const nuevoClienteId = nuevoCliente[0].insertId;

    // Actualizar presupuesto con el nuevo cliente_id
    await connection.execute(
      "UPDATE presupuestos SET cliente_id = ?, subtotal = ?, iva_monto = ?, total = ?, iva_porcentaje = ? WHERE id = ?",
      [nuevoClienteId, subtotal, iva_monto, total, iva_porcentaje, id]
    );

    // Eliminar productos existentes
    await connection.execute(
      "DELETE FROM presupuesto_productos WHERE presupuesto_id = ?",
      [id]
    );

    // Insertar nuevos productos
    for (const producto of productos) {
      await connection.execute(
        "INSERT INTO presupuesto_productos (presupuesto_id, nombre, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)",
        [
          id,
          producto.nombre,
          producto.cantidad,
          producto.precioUnitario,
          producto.subtotal,
        ]
      );
    }

    // Confirmar transacción
    await connection.commit();

    return await getPresupuestoById(id);
  } catch (error) {
    // Revertir transacción en caso de error
    await connection.rollback();
    console.error("Error en updatePresupuesto:", error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function deletePresupuesto(id) {
  // Iniciar transacción
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Verificar si el presupuesto existe
    const presupuestoExistente = await connection.execute(
      "SELECT id FROM presupuestos WHERE id = ?",
      [id]
    );

    if (presupuestoExistente[0].length === 0) {
      return null;
    }

    // Eliminar productos
    await connection.execute(
      "DELETE FROM presupuesto_productos WHERE presupuesto_id = ?",
      [id]
    );

    // Eliminar presupuesto
    await connection.execute("DELETE FROM presupuestos WHERE id = ?", [id]);

    // Confirmar transacción
    await connection.commit();

    return true;
  } catch (error) {
    // Revertir transacción en caso de error
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Modificar la función convertirPresupuestoAPedido para corregir el manejo de fechas
export async function convertirPresupuestoAPedido(
  id,
  estadoPago = "a_pagar",
  montoRestante = 0,
  fechaEntrega = null
) {
  // Iniciar transacción
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Verificar si el presupuesto existe
    const presupuestoExistente = await connection.execute(
      'SELECT id FROM presupuestos WHERE id = ? AND estado = "presupuesto"',
      [id]
    );

    if (presupuestoExistente[0].length === 0) {
      return null;
    }

    // Imprimir la fecha de entrega para depuración
    console.log("Fecha de entrega recibida:", fechaEntrega);

    // Si hay una fecha de entrega, asegurarse de que tenga el año correcto
    let fechaEntregaCorregida = fechaEntrega;
    if (fechaEntrega) {
      // Crear un objeto Date a partir de la fecha recibida
      const fecha = new Date(fechaEntrega);

      // Obtener el año actual
      const añoActual = new Date().getFullYear();

      // Si el año de la fecha es diferente al año actual, corregirlo
      if (fecha.getFullYear() !== añoActual) {
        // Establecer el año correcto
        fecha.setFullYear(añoActual);

        // Formatear la fecha como YYYY-MM-DD
        fechaEntregaCorregida = fecha.toISOString().split("T")[0];
        console.log("Fecha de entrega corregida:", fechaEntregaCorregida);
      }
    }

    // Actualizar estado del presupuesto a pedido
    await connection.execute(
      'UPDATE presupuestos SET estado = "pedido", fecha_conversion = ?, estado_pago = ?, monto_restante = ?, estado_entrega = "pendiente", fecha_entrega = ? WHERE id = ?',
      [new Date(), estadoPago, montoRestante, fechaEntregaCorregida, id]
    );

    // Confirmar transacción
    await connection.commit();

    return await getPedidoById(id);
  } catch (error) {
    // Revertir transacción en caso de error
    await connection.rollback();
    console.error("Error en convertirPresupuestoAPedido:", error);
    throw error;
  } finally {
    connection.release();
  }
}

// Funciones para pedidos
export async function getAllPedidos() {
  return await query(`
    SELECT p.*, c.nombre as cliente_nombre, c.domicilio 
    FROM presupuestos p
    LEFT JOIN clientes c ON p.cliente_id = c.id
    WHERE p.estado = 'pedido'
    ORDER BY p.fecha_conversion DESC
  `);
}

export async function getPedidoById(id) {
  console.log("getPedidoById - ID recibido:", id);

  // Primero, verificamos si el pedido existe con una consulta simple
  const pedidoCheck = await query(
    `SELECT id FROM presupuestos WHERE id = ? AND estado = 'pedido'`,
    [id]
  );

  console.log("getPedidoById - Verificación inicial:", pedidoCheck);

  if (pedidoCheck.length === 0) {
    console.log("getPedidoById - Pedido no encontrado con ID:", id);
    return null;
  }

  // Ahora hacemos la consulta completa con JOIN
  const pedidos = await query(
    `
    SELECT 
      p.id, 
      p.numero, 
      p.cliente_id, 
      p.subtotal, 
      p.iva_monto, 
      p.total, 
      p.iva_porcentaje, 
      p.estado, 
      p.fecha_creacion, 
      p.fecha_conversion, 
      p.estado_pago, 
      p.monto_restante, 
      p.estado_entrega, 
      p.chofer, 
      p.fecha_entrega,
      c.id AS cliente_id_original, 
      c.nombre, 
      c.domicilio, 
      c.entre_calles, 
      c.telefono
    FROM presupuestos p
    LEFT JOIN clientes c ON p.cliente_id = c.id
    WHERE p.id = ? AND p.estado = 'pedido'
    `,
    [id]
  );

  console.log("getPedidoById - Resultados encontrados:", pedidos.length);

  if (pedidos.length === 0) {
    return null;
  }

  const pedido = pedidos[0];
  console.log("getPedidoById - ID del pedido encontrado:", pedido.id);

  // Obtener los productos del pedido
  const productos = await query(
    `
    SELECT * FROM presupuesto_productos
    WHERE presupuesto_id = ?
    `,
    [id]
  );

  return {
    ...pedido,
    productos,
  };
}

export async function searchPedidos(searchTerm) {
  console.log("Ejecutando búsqueda de pedidos con query:", searchTerm);

  try {
    // Verificar si la consulta es un número
    const isNumeric = /^\d+$/.test(searchTerm);

    let results;
    if (isNumeric) {
      // Si es un número, buscar por número de pedido
      results = await query(
        `
        SELECT p.*, c.nombre as cliente_nombre, c.domicilio 
        FROM presupuestos p
        LEFT JOIN clientes c ON p.cliente_id = c.id
        WHERE p.estado = 'pedido' AND p.numero LIKE ?
        ORDER BY p.fecha_conversion DESC
      `,
        [`%${searchTerm}%`]
      );
    } else {
      // Si no es un número, buscar por nombre de cliente o dirección
      results = await query(
        `
        SELECT p.*, c.nombre as cliente_nombre, c.domicilio 
        FROM presupuestos p
        LEFT JOIN clientes c ON p.cliente_id = c.id
        WHERE p.estado = 'pedido' AND (
          c.nombre LIKE ? OR
          c.domicilio LIKE ?
        )
        ORDER BY p.fecha_conversion DESC
      `,
        [`%${searchTerm}%`, `%${searchTerm}%`]
      );
    }

    console.log(
      `Búsqueda completada. Resultados encontrados: ${results.length}`
    );
    return results;
  } catch (error) {
    console.error("Error en searchPedidos:", error);
    throw error;
  }
}

// Modificar updatePedido para crear un nuevo cliente en lugar de actualizar el existente
export async function updatePedido(id, data) {
  const { cliente, productos, subtotal, iva_monto, total, iva_porcentaje } =
    data;

  // Iniciar transacción
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Verificar si el pedido existe
    const pedidoExistente = await connection.execute(
      'SELECT id, cliente_id FROM presupuestos WHERE id = ? AND estado = "pedido"',
      [id]
    );

    if (pedidoExistente[0].length === 0) {
      return null;
    }

    // Crear un nuevo cliente en lugar de actualizar el existente
    const nuevoCliente = await connection.execute(
      "INSERT INTO clientes (nombre, domicilio, entre_calles, telefono) VALUES (?, ?, ?, ?)",
      [cliente.nombre, cliente.domicilio, cliente.entreCalles, cliente.telefono]
    );
    const nuevoClienteId = nuevoCliente[0].insertId;

    // Actualizar pedido con el nuevo cliente_id
    await connection.execute(
      "UPDATE presupuestos SET cliente_id = ?, subtotal = ?, iva_monto = ?, total = ?, iva_porcentaje = ? WHERE id = ?",
      [nuevoClienteId, subtotal, iva_monto, total, iva_porcentaje, id]
    );

    // Eliminar productos existentes
    await connection.execute(
      "DELETE FROM presupuesto_productos WHERE presupuesto_id = ?",
      [id]
    );

    // Insertar nuevos productos
    for (const producto of productos) {
      await connection.execute(
        "INSERT INTO presupuesto_productos (presupuesto_id, nombre, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)",
        [
          id,
          producto.nombre,
          producto.cantidad,
          producto.precioUnitario,
          producto.subtotal,
        ]
      );
    }

    // Confirmar transacción
    await connection.commit();

    return await getPedidoById(id);
  } catch (error) {
    // Revertir transacción en caso de error
    await connection.rollback();
    console.error("Error en updatePedido:", error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function actualizarEstadoPedido(id, data) {
  const { estado_entrega, chofer, estado_pago, monto_restante, fecha_entrega } =
    data;

  console.log("Actualizando estado del pedido:", id, data);

  // Iniciar transacción
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Verificar si el pedido existe
    const pedidoExistente = await connection.execute(
      'SELECT id FROM presupuestos WHERE id = ? AND estado = "pedido"',
      [id]
    );

    if (pedidoExistente[0].length === 0) {
      return null;
    }

    // Imprimir la fecha de entrega para depuración
    console.log(
      "Fecha de entrega recibida en actualizarEstadoPedido:",
      fecha_entrega
    );

    // Si hay una fecha de entrega, asegurarse de que tenga el año correcto
    let fechaEntregaCorregida = fecha_entrega;
    if (fecha_entrega) {
      // Crear un objeto Date a partir de la fecha recibida
      const fecha = new Date(fecha_entrega);

      // Obtener el año actual
      const añoActual = new Date().getFullYear();

      // Si el año de la fecha es diferente al año actual, corregirlo
      if (fecha.getFullYear() !== añoActual) {
        // Establecer el año correcto
        fecha.setFullYear(añoActual);

        // Formatear la fecha como YYYY-MM-DD
        fechaEntregaCorregida = fecha.toISOString().split("T")[0];
        console.log(
          "Fecha de entrega corregida en actualizarEstadoPedido:",
          fechaEntregaCorregida
        );
      }
    }

    // Actualizar estado del pedido
    await connection.execute(
      "UPDATE presupuestos SET estado_entrega = ?, chofer = ?, estado_pago = ?, monto_restante = ?, fecha_entrega = ? WHERE id = ?",
      [
        estado_entrega,
        chofer,
        estado_pago,
        monto_restante,
        fechaEntregaCorregida,
        id,
      ]
    );

    // Confirmar transacción
    await connection.commit();

    return await getPedidoById(id);
  } catch (error) {
    // Revertir transacción en caso de error
    await connection.rollback();
    console.error("Error en actualizarEstadoPedido:", error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function deletePedido(id) {
  // Iniciar transacción
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Verificar si el pedido existe
    const pedidoExistente = await connection.execute(
      'SELECT id FROM presupuestos WHERE id = ? AND estado = "pedido"',
      [id]
    );

    if (pedidoExistente[0].length === 0) {
      return null;
    }

    // Eliminar productos
    await connection.execute(
      "DELETE FROM presupuesto_productos WHERE presupuesto_id = ?",
      [id]
    );

    // Eliminar pedido
    await connection.execute("DELETE FROM presupuestos WHERE id = ?", [id]);

    // Confirmar transacción
    await connection.commit();

    return true;
  } catch (error) {
    // Revertir transacción en caso de error
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Funciones para choferes
export async function getAllChoferes() {
  return await query(`
    SELECT * FROM choferes
    ORDER BY nombre ASC
  `);
}

export async function createChofer(nombre) {
  const result = await query(
    `
    INSERT INTO choferes (nombre)
    VALUES (?)
  `,
    [nombre]
  );

  return {
    id: result.insertId,
    nombre,
  };
}

export async function getPedidosByChofer(nombre) {
  return await query(
    `
    SELECT p.*, c.nombre as cliente_nombre 
    FROM presupuestos p
    LEFT JOIN clientes c ON p.cliente_id = c.id
    WHERE p.estado = 'pedido' AND p.estado_entrega = 'entregado' AND p.chofer = ?
    ORDER BY p.fecha_conversion DESC
  `,
    [nombre]
  );
}

// Agregar estas funciones al archivo lib/db.js

// Modificar la función getPedidosByFecha para incluir el domicilio del cliente
export async function getPedidosByFecha(fecha) {
  console.log("Ejecutando búsqueda de pedidos para la fecha:", fecha);

  try {
    // Asegurarnos de que la fecha esté en formato YYYY-MM-DD
    const formattedFecha = fecha.split("T")[0];

    console.log("Fecha formateada para búsqueda:", formattedFecha);

    // Consulta SQL que compara solo la parte de fecha (sin hora) y obtiene el domicilio del cliente
    const results = await query(
      `
      SELECT p.*, c.nombre as cliente_nombre, c.domicilio 
      FROM presupuestos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      WHERE p.estado = 'pedido' AND DATE(p.fecha_entrega) = ?
      ORDER BY p.fecha_conversion DESC
      `,
      [formattedFecha]
    );

    console.log(
      `Búsqueda completada. Resultados encontrados: ${results.length}`
    );
    return results;
  } catch (error) {
    console.error("Error en getPedidosByFecha:", error);
    throw error;
  }
}

// Modificar la función getPedidosProgramados para incluir el domicilio del cliente
export async function getPedidosProgramados(fechaDesde = null) {
  console.log(
    "Ejecutando búsqueda de pedidos programados desde fecha:",
    fechaDesde
  );

  try {
    let query = `
      SELECT p.*, c.nombre as cliente_nombre, c.domicilio 
      FROM presupuestos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      WHERE p.estado = 'pedido' AND p.fecha_entrega IS NOT NULL AND p.estado_entrega = 'pendiente'
    `;

    const params = [];

    if (fechaDesde) {
      // Si se proporciona una fecha, filtrar pedidos a partir de esa fecha
      // Pero excluyendo los pedidos de hoy (que se mostrarán en "Pedidos para Hoy")
      query += ` AND DATE(p.fecha_entrega) >= DATE(?)`;
      params.push(fechaDesde);

      // Imprimir la consulta SQL para depuración
      console.log("Consulta SQL para pedidos programados:", query);
      console.log("Parámetros:", params);
    }

    query += ` ORDER BY p.fecha_entrega ASC`;

    const [results] = await pool.execute(query, params);

    // Imprimir los resultados para depuración
    console.log(
      `Búsqueda completada. Resultados encontrados: ${results.length}`
    );
    if (results.length > 0) {
      console.log("Primer resultado fecha_entrega:", results[0].fecha_entrega);
      console.log(
        "Último resultado fecha_entrega:",
        results[results.length - 1].fecha_entrega
      );
      console.log("Ejemplo de domicilio:", results[0].domicilio);
    }

    return results;
  } catch (error) {
    console.error("Error en getPedidosProgramados:", error);
    throw error;
  }
}

// Función auxiliar para generar número de presupuesto
async function generarNumeroPresupuesto() {
  const fecha = new Date();
  const año = fecha.getFullYear().toString().slice(-2);
  const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");

  // Obtener el último número de presupuesto del mes actual
  const ultimoPresupuesto = await query(
    `
    SELECT numero FROM presupuestos
    WHERE numero LIKE ?
    ORDER BY id DESC
    LIMIT 1
  `,
    [`${año}${mes}%`]
  );

  let secuencia = 1;

  if (ultimoPresupuesto.length > 0) {
    const ultimoNumero = ultimoPresupuesto[0].numero;
    secuencia = Number.parseInt(ultimoNumero.slice(-4)) + 1;
  }

  return `${año}${mes}${secuencia.toString().padStart(4, "0")}`;
}
