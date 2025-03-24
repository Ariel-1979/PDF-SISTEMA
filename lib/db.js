import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

async function query(sql, params) {
  const [results] = await pool.execute(sql, params);
  return results;
}

export async function getAllPresupuestos(limit = null) {
  let sql = `
    SELECT p.*, c.domicilio, c.localidad, c.nombre as cliente_nombre 
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
  const presupuestoCheck = await query(
    `SELECT id FROM presupuestos WHERE id = ?`,
    [id]
  );

  if (presupuestoCheck.length === 0) {
    return null;
  }

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
      p.descuento_porcentaje,
      p.descuento_monto,
      p.estado_pago, 
      p.monto_restante, 
      p.estado_entrega, 
      p.chofer, 
      c.id AS cliente_id_original, 
      c.nombre, 
      c.domicilio, 
      c.entre_calles,
      c.localidad,
      c.telefono
    FROM presupuestos p
    LEFT JOIN clientes c ON p.cliente_id = c.id
    WHERE p.id = ?
    `,
    [id]
  );

  if (presupuestos.length === 0) {
    return null;
  }

  const presupuesto = presupuestos[0];

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
  try {
    const isNumeric = /^\d+$/.test(searchTerm);

    let results;
    if (isNumeric) {
      results = await query(
        `
        SELECT p.*, c.domicilio, c.localidad, c.nombre as cliente_nombre 
        FROM presupuestos p
        LEFT JOIN clientes c ON p.cliente_id = c.id
        WHERE p.estado = 'presupuesto' AND p.numero LIKE ?
        ORDER BY p.fecha_creacion DESC
      `,
        [`%${searchTerm}%`]
      );
    } else {
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
    return results;
  } catch (error) {
    throw error;
  }
}

export async function createPresupuesto(data) {
  const {
    cliente,
    productos,
    subtotal,
    iva_monto,
    total,
    iva_porcentaje,
    descuento_porcentaje,
    descuento_monto,
  } = data;

  if (!Array.isArray(productos) || productos.length === 0) {
    throw new Error("La lista de productos es inválida o está vacía");
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const nuevoCliente = await connection.execute(
      "INSERT INTO clientes (nombre, domicilio, entre_calles, localidad, telefono) VALUES (?, ?, ?, ?, ?)",
      [
        cliente.nombre,
        cliente.domicilio,
        cliente.entreCalles,
        cliente.localidad,
        cliente.telefono,
      ]
    );
    const clienteId = nuevoCliente[0].insertId;

    const fechaCreacion = new Date();
    const numero = await generarNumeroPresupuesto();

    const presupuestoResult = await connection.execute(
      `INSERT INTO presupuestos (
        numero, 
        cliente_id, 
        subtotal, 
        iva_monto, 
        total, 
        iva_porcentaje, 
        descuento_porcentaje, 
        descuento_monto, 
        estado, 
        fecha_creacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        numero,
        clienteId,
        subtotal,
        iva_monto,
        total,
        iva_porcentaje,
        descuento_porcentaje,
        descuento_monto,
        "presupuesto",
        fechaCreacion,
      ]
    );

    const presupuestoId = presupuestoResult[0].insertId;

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

    await connection.commit();

    return {
      id: presupuestoId,
      numero,
      cliente_id: clienteId,
      subtotal,
      iva_monto,
      total,
      iva_porcentaje,
      descuento_porcentaje,
      descuento_monto,
      estado: "presupuesto",
      fecha_creacion: fechaCreacion,
    };
  } catch (error) {
    await connection.rollback();
    console.error("Error en createPresupuesto:", error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function updatePresupuesto(id, data) {
  const {
    cliente,
    productos,
    subtotal,
    iva_monto,
    total,
    iva_porcentaje,
    descuento_porcentaje,
    descuento_monto,
  } = data;

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const presupuestoExistente = await connection.execute(
      "SELECT id, cliente_id FROM presupuestos WHERE id = ?",
      [id]
    );

    if (presupuestoExistente[0].length === 0) {
      return null;
    }

    const clienteId = presupuestoExistente[0][0].cliente_id;

    const nuevoCliente = await connection.execute(
      "INSERT INTO clientes (nombre, domicilio, entre_calles, localidad, telefono) VALUES (?, ?, ?, ?, ?)",
      [
        cliente.nombre,
        cliente.domicilio,
        cliente.entreCalles,
        cliente.localidad,
        cliente.telefono,
      ]
    );
    const nuevoClienteId = nuevoCliente[0].insertId;

    await connection.execute(
      "UPDATE presupuestos SET cliente_id = ?, subtotal = ?, iva_monto = ?, total = ?, iva_porcentaje = ?, descuento_porcentaje = ?, descuento_monto = ? WHERE id = ?",
      [
        nuevoClienteId,
        subtotal,
        iva_monto,
        total,
        iva_porcentaje,
        descuento_porcentaje,
        descuento_monto,
        id,
      ]
    );

    await connection.execute(
      "DELETE FROM presupuesto_productos WHERE presupuesto_id = ?",
      [id]
    );

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

    await connection.commit();

    return await getPresupuestoById(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deletePresupuesto(id) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const presupuestoExistente = await connection.execute(
      "SELECT id, cliente_id FROM presupuestos WHERE id = ?",
      [id]
    );

    if (presupuestoExistente[0].length === 0) {
      return null;
    }

    const clienteId = presupuestoExistente[0][0].cliente_id;

    await connection.execute(
      "DELETE FROM presupuesto_productos WHERE presupuesto_id = ?",
      [id]
    );

    await connection.execute("DELETE FROM presupuestos WHERE id = ?", [id]);

    if (clienteId) {
      await connection.execute("DELETE FROM clientes WHERE id = ?", [
        clienteId,
      ]);
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function convertirPresupuestoAPedido(
  id,
  estadoPago = "a_pagar",
  montoRestante = 0,
  fechaEntrega = null
) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const presupuestoExistente = await connection.execute(
      'SELECT id FROM presupuestos WHERE id = ? AND estado = "presupuesto"',
      [id]
    );

    if (presupuestoExistente[0].length === 0) {
      return null;
    }

    let fechaEntregaCorregida = fechaEntrega;
    if (fechaEntrega) {
      const fecha = new Date(fechaEntrega);

      const añoActual = new Date().getFullYear();

      if (fecha.getFullYear() !== añoActual) {
        fecha.setFullYear(añoActual);

        fechaEntregaCorregida = fecha.toISOString().split("T")[0];
        console.log("Fecha de entrega corregida:", fechaEntregaCorregida);
      }
    }

    await connection.execute(
      'UPDATE presupuestos SET estado = "pedido", fecha_conversion = ?, estado_pago = ?, monto_restante = ?, estado_entrega = "pendiente", fecha_entrega = ? WHERE id = ?',
      [new Date(), estadoPago, montoRestante, fechaEntregaCorregida, id]
    );

    await connection.commit();
    return await getPedidoById(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

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
  const pedidoCheck = await query(
    `SELECT id FROM presupuestos WHERE id = ? AND estado = 'pedido'`,
    [id]
  );

  if (pedidoCheck.length === 0) {
    console.log("getPedidoById - Pedido no encontrado con ID:", id);
    return null;
  }

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
      p.descuento_porcentaje,
      p.descuento_monto,
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
      c.localidad, 
      c.telefono
    FROM presupuestos p
    LEFT JOIN clientes c ON p.cliente_id = c.id
    WHERE p.id = ? AND p.estado = 'pedido'
    `,
    [id]
  );

  if (pedidos.length === 0) {
    return null;
  }

  const pedido = pedidos[0];

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
  try {
    const isNumeric = /^\d+$/.test(searchTerm);

    let results;
    if (isNumeric) {
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

    return results;
  } catch (error) {
    throw error;
  }
}

export async function updatePedido(id, data) {
  const {
    cliente,
    productos,
    subtotal,
    iva_monto,
    total,
    iva_porcentaje,
    descuento_porcentaje,
    descuento_monto,
  } = data;

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const pedidoExistente = await connection.execute(
      'SELECT id, cliente_id FROM presupuestos WHERE id = ? AND estado = "pedido"',
      [id]
    );

    if (pedidoExistente[0].length === 0) {
      return null;
    }

    const nuevoCliente = await connection.execute(
      "INSERT INTO clientes (nombre, domicilio, entre_calles, localidad, telefono) VALUES (?, ?, ?, ?, ?)",
      [
        cliente.nombre,
        cliente.domicilio,
        cliente.entreCalles,
        cliente.localidad,
        cliente.telefono,
      ]
    );
    const nuevoClienteId = nuevoCliente[0].insertId;

    await connection.execute(
      "UPDATE presupuestos SET cliente_id = ?, subtotal = ?, iva_monto = ?, total = ?, iva_porcentaje = ?, descuento_porcentaje = ?, descuento_monto = ? WHERE id = ?",
      [
        nuevoClienteId,
        subtotal,
        iva_monto,
        total,
        iva_porcentaje,
        descuento_porcentaje,
        descuento_monto,
        id,
      ]
    );

    await connection.execute(
      "DELETE FROM presupuesto_productos WHERE presupuesto_id = ?",
      [id]
    );

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

    await connection.commit();

    return await getPedidoById(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function actualizarEstadoPedido(id, data) {
  const { estado_entrega, chofer, estado_pago, monto_restante, fecha_entrega } =
    data;

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const pedidoExistente = await connection.execute(
      'SELECT id FROM presupuestos WHERE id = ? AND estado = "pedido"',
      [id]
    );

    if (pedidoExistente[0].length === 0) {
      return null;
    }

    let fechaEntregaCorregida = fecha_entrega;
    if (fecha_entrega) {
      const fecha = new Date(fecha_entrega);

      const añoActual = new Date().getFullYear();

      if (fecha.getFullYear() !== añoActual) {
        fecha.setFullYear(añoActual);

        fechaEntregaCorregida = fecha.toISOString().split("T")[0];
      }
    }

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

    await connection.commit();

    return await getPedidoById(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deletePedido(id) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const pedidoExistente = await connection.execute(
      'SELECT id, cliente_id FROM presupuestos WHERE id = ? AND estado = "pedido"',
      [id]
    );

    if (pedidoExistente[0].length === 0) {
      return null;
    }

    const clienteId = pedidoExistente[0][0].cliente_id;

    await connection.execute(
      "DELETE FROM presupuesto_productos WHERE presupuesto_id = ?",
      [id]
    );

    await connection.execute("DELETE FROM presupuestos WHERE id = ?", [id]);

    if (clienteId) {
      await connection.execute("DELETE FROM clientes WHERE id = ?", [
        clienteId,
      ]);
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getAllChoferes() {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const { rows } = await connection.execute(
      "SELECT id, nombre FROM choferes ORDER BY nombre ASC"
    );
    return rows;
  } catch (error) {
    console.error("Error al obtener choferes:", error);
    throw new Error(`Error al obtener choferes: ${error.message}`);
  }
}

export async function createChofer(nombre) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  const result = await connection.execute(
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

export async function updateChofer(id, nombre) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const { rows } = await connection.execute(`
      UPDATE choferes 
      SET nombre = ${nombre} 
      WHERE id = ${id} 
      RETURNING *
    `);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw new Error(`Error al actualizar chofer: ${error.message}`);
  }
}

export async function deleteChofer(id) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const { rows } = await connection.execute(`
      DELETE FROM choferes 
      WHERE id = ${id} 
      RETURNING id
    `);

    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw new Error(`Error al eliminar chofer: ${error.message}`);
  }
}

export async function getPedidosByChofer(nombre) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const { rows } = await connection.execute(`
      SELECT p.*, c.domicilio as cliente_domicilio, c.nombre as cliente_nombre
      FROM presupuestos p
      JOIN choferes ch ON p.chofer = ch.nombre
      LEFT JOIN clientes c ON p.cliente_id = c.id
      WHERE ch.nombre = ${nombre}
    `);
    return rows;
  } catch (error) {
    throw new Error(`Error al obtener pedidos: ${error.message}`);
  }
}

export async function getPedidosByFecha(fecha) {
  try {
    const formattedFecha = fecha.split("T")[0];

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

    return results;
  } catch (error) {
    console.error("Error en getPedidosByFecha:", error);
    throw error;
  }
}

export async function getPedidosProgramados(fechaDesde = null) {
  try {
    let query = `
      SELECT p.*, c.nombre as cliente_nombre, c.domicilio 
      FROM presupuestos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      WHERE p.estado = 'pedido' AND p.fecha_entrega IS NOT NULL AND p.estado_entrega = 'pendiente'
    `;

    const params = [];

    if (fechaDesde) {
      // Pero excluyendo los pedidos de hoy (que se mostrarán en "Pedidos para Hoy")
      query += ` AND DATE(p.fecha_entrega) >= DATE(?)`;
      params.push(fechaDesde);
    }

    query += ` ORDER BY p.fecha_entrega ASC`;

    const [results] = await pool.execute(query, params);

    if (results.length > 0) {
      console.log("Primer resultado fecha_entrega:", results[0].fecha_entrega);
      console.log(
        "Último resultado fecha_entrega:",
        results[results.length - 1].fecha_entrega
      );
    }

    return results;
  } catch (error) {
    throw error;
  }
}

export async function deleteAllPedidos() {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const [pedidos] = await connection.execute(
      'SELECT id, cliente_id FROM presupuestos WHERE estado = "pedido"'
    );

    if (pedidos.length === 0) {
      await connection.commit();
      return { success: true, count: 0 };
    }

    const clienteIds = pedidos
      .map((pedido) => pedido.cliente_id)
      .filter((id) => id !== null && id !== undefined);

    await connection.execute(
      'DELETE pp FROM presupuesto_productos pp JOIN presupuestos p ON pp.presupuesto_id = p.id WHERE p.estado = "pedido"'
    );

    await connection.execute(
      'DELETE FROM presupuestos WHERE estado = "pedido"'
    );

    if (clienteIds.length > 0) {
      const placeholders = clienteIds.map(() => "?").join(",");
      await connection.execute(
        `DELETE FROM clientes WHERE id IN (${placeholders})`,
        clienteIds
      );
    }

    await connection.commit();
    return { success: true, count: pedidos.length };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function generarNumeroPresupuesto() {
  const fecha = new Date();
  const año = fecha.getFullYear().toString().slice(-2);
  const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");

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
