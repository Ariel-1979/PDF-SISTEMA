"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileDown, Edit, Save } from "lucide-react";
import Link from "next/link";

const PedidoDetail = ({ pedido }) => {
  const router = useRouter();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [chofer, setChofer] = useState(pedido?.chofer || "");
  const [estadoEntrega, setEstadoEntrega] = useState(
    pedido?.estado_entrega || "pendiente"
  );
  const [estadoPago, setEstadoPago] = useState(
    pedido?.estado_pago || "a_pagar"
  );
  const [montoRestante, setMontoRestante] = useState(
    pedido?.monto_restante || 0
  );
  const [fechaEntrega, setFechaEntrega] = useState(
    pedido?.fecha_entrega
      ? new Date(pedido.fecha_entrega).toISOString().split("T")[0]
      : ""
  );
  const [saving, setSaving] = useState(false);
  const [choferes, setChoferes] = useState([]);
  const [loadingChoferes, setLoadingChoferes] = useState(false);

  // Agregar más logs para depuración
  useEffect(() => {
    if (pedido) {
      console.log("PedidoDetail - ID del pedido cargado:", pedido.id);
      console.log("PedidoDetail - Datos completos del pedido:", pedido);
    }
  }, [pedido]);

  useEffect(() => {
    // Cargar la lista de choferes cuando se abre el formulario de edición
    if (editing) {
      fetchChoferes();
    }
  }, [editing]);

  const fetchChoferes = async () => {
    try {
      setLoadingChoferes(true);
      const res = await fetch("/api/choferes");
      const data = await res.json();
      setChoferes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar choferes:", error);
      showToast("Error al cargar la lista de choferes", "error");
    } finally {
      setLoadingChoferes(false);
    }
  };

  if (!pedido) {
    return (
      <div className="pedido-detail-container">
        <div className="loading">Pedido no encontrado</div>
      </div>
    );
  }

  // Asegurarnos de que estamos usando el ID correcto
  const pedidoId = pedido.id;
  console.log("PedidoDetail - ID que se usará para operaciones:", pedidoId);

  // Calcular subtotal e IVA
  const subtotal = pedido.subtotal || pedido.total;
  const ivaPorcentaje = pedido.iva_porcentaje || "0%";
  const ivaMonto = pedido.iva_monto || 0;
  const total = pedido.total;

  // Modifica la función generarPDF para usar importación dinámica
  // Modifica la función generarPDF para usar importación dinámica
  const generarPDF = async () => {
    // Importamos jsPDF y autoTable dinámicamente
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();

    // Agregar logo
    const logoImg = new Image();
    logoImg.src =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo_Luongo-2yJWkbBhykRbk43ImjzWGhnPvuw3uR.png";

    await new Promise((resolve) => {
      logoImg.onload = resolve;
    });

    // Calcular dimensiones para mantener la proporción
    const imgWidth = 50;
    const imgHeight = (logoImg.height * imgWidth) / logoImg.width;

    // Agregar logo centrado
    doc.addImage(
      logoImg,
      "PNG",
      (doc.internal.pageSize.width - imgWidth) / 2,
      10,
      imgWidth,
      imgHeight
    );

    // Título
    doc.setFontSize(16);
    doc.text("Pedido", 105, 40, { align: "center" });
    doc.text("Materiales para la Construcción", 105, 48, { align: "center" });

    // Número de pedido
    doc.setFontSize(14);
    doc.text(`Pedido N°: ${pedido.numero}`, 105, 60, { align: "center" });

    // Información del cliente
    doc.setFontSize(12);
    doc.text(`Cliente: ${pedido.nombre}`, 20, 70);
    doc.text(`Domicilio: ${pedido.domicilio}`, 20, 78);
    doc.text(`Entre calles: ${pedido.entre_calles}`, 20, 86);
    doc.text(`Teléfono: ${pedido.telefono}`, 20, 94);

    // Fecha
    const fecha = new Date(
      pedido.fecha_conversion || pedido.fecha_creacion
    ).toLocaleDateString();
    doc.text(`Fecha: ${fecha}`, 150, 70);

    // Fecha de entrega
    if (pedido.fecha_entrega) {
      doc.text(
        `Fecha de entrega: ${new Date(
          pedido.fecha_entrega
        ).toLocaleDateString()}`,
        150,
        78
      );
    } else {
      doc.text(`Fecha de entrega: Pendiente`, 150, 78);
    }

    // Estado de pago
    doc.text(
      `Estado de pago: ${getEstadoPagoText(pedido.estado_pago)}`,
      150,
      86
    );

    if (pedido.estado_pago === "resta_abonar") {
      doc.text(
        `Monto restante: $${Number(pedido.monto_restante).toLocaleString()}`,
        150,
        94
      );
    }

    // Tabla de productos
    const tableColumn = ["Cantidad", "Producto", "Precio Unitario", "Subtotal"];
    const tableRows = [];

    pedido.productos.forEach((producto) => {
      const productData = [
        producto.cantidad,
        producto.nombre,
        `$${Number(producto.precio_unitario).toLocaleString()}`,
        `$${Number(producto.subtotal).toLocaleString()}`,
      ];
      tableRows.push(productData);
    });

    // Usar autoTable como función independiente en lugar de método
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 110,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [255, 102, 0] },
    });

    // Subtotal, IVA y Total
    const finalY = doc.lastAutoTable.finalY || 110;

    doc.text(
      `Subtotal: $${Number(subtotal).toLocaleString()}`,
      150,
      finalY + 10
    );

    if (Number.parseFloat(ivaPorcentaje) > 0) {
      doc.text(
        `IVA (${ivaPorcentaje}): $${Number(ivaMonto).toLocaleString()}`,
        150,
        finalY + 18
      );
      doc.text(`Total: $${Number(total).toLocaleString()}`, 150, finalY + 26);
    } else {
      doc.text(`Total: $${Number(total).toLocaleString()}`, 150, finalY + 18);
    }

    // Términos y condiciones
    doc.setFontSize(8);
    doc.text(
      "Los cambios y devoluciones se aceptan dentro de las 24/48hs de la recepción de la compra.",
      20,
      finalY + 40
    );
    doc.text(
      "Los materiales o productos de segunda selección, no tienen cambio, ni devolución.",
      20,
      finalY + 45
    );

    doc.save(`pedido-${pedido.numero}.pdf`);
    showToast("PDF generado correctamente", "success");
  };

  const getEstadoPagoText = (estado) => {
    switch (estado) {
      case "abonado":
        return "Abonado";
      case "a_pagar":
        return "A Pagar";
      case "resta_abonar":
        return "Resta Abonar";
      default:
        return "Desconocido";
    }
  };

  const getEstadoEntregaText = (estado) => {
    switch (estado) {
      case "pendiente":
        return "Pendiente";
      case "entregado":
        return "Entregado";
      default:
        return "Desconocido";
    }
  };

  // Modificar la función handleSaveChanges para corregir el manejo de fechas
  const handleSaveChanges = async () => {
    if (estadoEntrega === "entregado" && !chofer.trim()) {
      showToast("Debe ingresar un chofer para pedidos entregados", "error");
      return;
    }

    try {
      setSaving(true);

      // Corregir la fecha de entrega si es necesario
      let fechaEntregaCorregida = fechaEntrega;
      if (fechaEntrega) {
        // Crear un objeto Date a partir de la fecha seleccionada
        const fecha = new Date(fechaEntrega);

        // Obtener el año actual
        const añoActual = new Date().getFullYear();

        // Si el año de la fecha es diferente al año actual, corregirlo
        if (fecha.getFullYear() !== añoActual) {
          // Establecer el año correcto
          fecha.setFullYear(añoActual);

          // Formatear la fecha como YYYY-MM-DD
          fechaEntregaCorregida = fecha.toISOString().split("T")[0];
          console.log(
            "Fecha de entrega corregida en handleSaveChanges:",
            fechaEntregaCorregida
          );
        }
      }

      const data = {
        chofer: estadoEntrega === "entregado" ? chofer : null,
        estado_entrega: estadoEntrega,
        estado_pago: estadoPago,
        monto_restante: estadoPago === "resta_abonar" ? montoRestante : 0,
        fecha_entrega: fechaEntregaCorregida || null,
      };

      console.log(
        "Enviando datos para actualizar estado:",
        JSON.stringify(data)
      );
      console.log("ID del pedido para actualizar estado:", pedidoId);

      const response = await fetch(
        `/api/pedidos/${pedidoId}/actualizar-estado`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar el pedido");
      }

      await response.json();
      showToast("Pedido actualizado correctamente", "success");

      // Recargar la página para mostrar los cambios actualizados
      window.location.reload();
    } catch (error) {
      console.error("Error al actualizar pedido:", error);
      showToast(`Error al actualizar el pedido: ${error.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  // Mostrar la fecha de entrega si existe
  const mostrarFechaEntrega = pedido.fecha_entrega
    ? new Date(pedido.fecha_entrega).toLocaleDateString()
    : "No especificada";

  return (
    <div className="pedido-detail-container">
      <div className="pedido-detail-header">
        <h2>Pedido #{pedido.numero}</h2>
        <div className="pedido-detail-actions">
          <button
            className="btn btn-secondary btn-icon"
            onClick={() => router.back()}
          >
            <ArrowLeft size={20} />
            <span>Volver</span>
          </button>
          <button className="btn btn-descargar btn-icon" onClick={generarPDF}>
            <FileDown size={20} />
            <span>Descargar PDF</span>
          </button>
          {/* Agregar log para depurar el ID usado en el enlace */}
          <Link
            href={`/pedidos/${pedidoId}/editar`}
            className="btn btn-primary btn-icon"
            onClick={() =>
              console.log("Navegando a editar pedido con ID:", pedidoId)
            }
          >
            <Edit size={20} />
            <span>Editar Pedido</span>
          </Link>
          {!editing ? (
            <button
              className="btn btn-primary btn-icon"
              onClick={() => setEditing(true)}
            >
              <Edit size={20} />
              <span>Editar Estado</span>
            </button>
          ) : (
            <button
              className="btn btn-primary btn-icon"
              onClick={handleSaveChanges}
              disabled={saving}
            >
              <Save size={20} />
              <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
            </button>
          )}
        </div>
      </div>

      <div className="pedido-detail-info">
        <div className="pedido-detail-section">
          <h3>Información del Cliente</h3>
          <div className="pedido-detail-client">
            <p>
              <strong>Nombre:</strong> {pedido.nombre}
            </p>
            <p>
              <strong>Domicilio:</strong> {pedido.domicilio}
            </p>
            <p>
              <strong>Entre calles:</strong> {pedido.entre_calles}
            </p>
            <p>
              <strong>Teléfono:</strong> {pedido.telefono}
            </p>
            {/* Se ha eliminado el campo IVA de la información del cliente */}
          </div>
        </div>

        <div className="pedido-detail-section">
          <h3>Detalles del Pedido</h3>
          <div className="pedido-detail-meta">
            <p>
              <strong>Fecha de creación:</strong>{" "}
              {new Date(pedido.fecha_creacion).toLocaleDateString()}
            </p>
            <p>
              <strong>Fecha del pedido:</strong>{" "}
              {pedido.fecha_conversion
                ? new Date(pedido.fecha_conversion).toLocaleDateString()
                : "N/A"}
            </p>
            <p>
              <strong>Fecha de entrega:</strong> {mostrarFechaEntrega}
            </p>

            {!editing ? (
              <>
                <p>
                  <strong>Estado de entrega:</strong>{" "}
                  {getEstadoEntregaText(pedido.estado_entrega)}
                </p>
                {pedido.estado_entrega === "entregado" && pedido.chofer && (
                  <p>
                    <strong>Chofer:</strong> {pedido.chofer}
                  </p>
                )}
                <p>
                  <strong>Estado de pago:</strong>{" "}
                  {getEstadoPagoText(pedido.estado_pago)}
                </p>
                {pedido.estado_pago === "resta_abonar" && (
                  <p>
                    <strong>Monto restante:</strong> $
                    {Number(pedido.monto_restante).toLocaleString()}
                  </p>
                )}
              </>
            ) : (
              <div className="edit-form">
                <div className="form-group">
                  <label htmlFor="fechaEntrega">Fecha de Entrega</label>
                  <input
                    type="date"
                    id="fechaEntrega"
                    className="form-control"
                    value={fechaEntrega}
                    onChange={(e) => setFechaEntrega(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="estadoEntrega">Estado de Entrega</label>
                  <select
                    id="estadoEntrega"
                    className="form-control"
                    value={estadoEntrega}
                    onChange={(e) => setEstadoEntrega(e.target.value)}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="entregado">Entregado</option>
                  </select>
                </div>

                {estadoEntrega === "entregado" && (
                  <div className="form-group">
                    <label htmlFor="chofer">Chofer</label>
                    {loadingChoferes ? (
                      <p>Cargando choferes...</p>
                    ) : (
                      <select
                        id="chofer"
                        className="form-control"
                        value={chofer}
                        onChange={(e) => setChofer(e.target.value)}
                        required
                      >
                        <option value="">Seleccione un chofer</option>
                        {choferes.map((c) => (
                          <option key={c.id} value={c.nombre}>
                            {c.nombre}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="estadoPago">Estado de Pago</label>
                  <select
                    id="estadoPago"
                    className="form-control"
                    value={estadoPago}
                    onChange={(e) => setEstadoPago(e.target.value)}
                  >
                    <option value="abonado">Abonado</option>
                    <option value="a_pagar">A Pagar</option>
                    <option value="resta_abonar">Resta Abonar</option>
                  </select>
                </div>

                {estadoPago === "resta_abonar" && (
                  <div className="form-group">
                    <label htmlFor="montoRestante">Monto Restante</label>
                    <input
                      type="number"
                      id="montoRestante"
                      className="form-control"
                      value={montoRestante}
                      onChange={(e) => setMontoRestante(Number(e.target.value))}
                      required
                      min="0"
                      step="1"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pedido-detail-products">
        <h3>Productos</h3>
        <div className="pedido-detail-table">
          <div className="pedido-detail-table-header">
            <div className="pedido-detail-column">Cantidad</div>
            <div className="pedido-detail-column product-name">Producto</div>
            <div className="pedido-detail-column">Precio Unitario</div>
            <div className="pedido-detail-column">Subtotal</div>
          </div>

          {pedido.productos.map((producto) => (
            <div key={producto.id} className="pedido-detail-table-row">
              <div className="pedido-detail-column" data-label="Cantidad">
                {producto.cantidad}
              </div>
              <div
                className="pedido-detail-column product-name"
                data-label="Producto"
              >
                {producto.nombre}
              </div>
              <div
                className="pedido-detail-column"
                data-label="Precio Unitario"
              >
                ${Number(producto.precio_unitario).toLocaleString()}
              </div>
              <div className="pedido-detail-column" data-label="Subtotal">
                ${Number(producto.subtotal).toLocaleString()}
              </div>
            </div>
          ))}

          <div className="pedido-detail-table-footer">
            <div className="pedido-detail-total">
              <p>
                <strong>Subtotal:</strong> ${Number(subtotal).toLocaleString()}
              </p>
              {Number.parseFloat(ivaPorcentaje) > 0 && (
                <p>
                  <strong>IVA ({ivaPorcentaje}):</strong> $
                  {Number(ivaMonto).toLocaleString()}
                </p>
              )}
              <p className="total-final">
                <strong>Total:</strong> ${Number(total).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PedidoDetail;
