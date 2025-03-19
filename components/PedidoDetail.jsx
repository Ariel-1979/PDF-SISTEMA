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
  // Modificar la función generarPDF para implementar los cambios solicitados
  // Buscar la función generarPDF y reemplazar con esta versión actualizada

  const generarPDF = async () => {
    try {
      // Importamos jsPDF y autoTable dinámicamente
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      // Crear un nuevo documento PDF
      const doc = new jsPDF();

      // Colores corporativos
      const primaryColor = [255, 102, 0]; // Naranja #ff6600
      const secondaryColor = [74, 109, 167]; // Azul #4a6da7
      const textColor = [51, 51, 51]; // Gris oscuro #333333

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

      // Encabezado - Orden cambiado según lo solicitado
      doc.setFontSize(14);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("Materiales para la Construcción", 105, 40, { align: "center" });

      doc.setFontSize(22);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("PEDIDO", 105, 50, { align: "center" });

      // Número de pedido y fecha en el mismo renglón
      const fecha = new Date(
        pedido.fecha_conversion || pedido.fecha_creacion
      ).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      doc.setFontSize(10);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(`NÚMERO: ${pedido.numero}   |   FECHA: ${fecha}`, 105, 62, {
        align: "center",
      });

      // Fecha de entrega si existe
      if (pedido.fecha_entrega) {
        doc.text(
          `FECHA DE ENTREGA: ${new Date(
            pedido.fecha_entrega
          ).toLocaleDateString("es-AR")}`,
          105,
          70,
          {
            align: "center",
          }
        );
      }

      // Información del cliente - En negrita sin fondo naranja
      doc.setFontSize(12);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont(undefined, "bold");
      doc.text("INFORMACIÓN DEL CLIENTE", 15, 80);
      doc.setFont(undefined, "normal");

      doc.setFontSize(10);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);

      // Organizar datos del cliente en dos columnas para aprovechar espacio
      let leftColY = 90;
      let rightColY = 90;
      const midPoint = doc.internal.pageSize.width / 2;

      // Columna izquierda
      doc.text(`Cliente: ${pedido.nombre}`, 15, leftColY);
      leftColY += 7;

      if (pedido.domicilio) {
        doc.text(`Domicilio: ${pedido.domicilio}`, 15, leftColY);
        leftColY += 7;
      }

      // Columna derecha
      if (pedido.entre_calles) {
        doc.text(
          `Entre calles: ${pedido.entre_calles}`,
          midPoint + 5,
          rightColY
        );
        rightColY += 7;
      }

      if (pedido.telefono) {
        doc.text(`Teléfono: ${pedido.telefono}`, midPoint + 5, rightColY);
        rightColY += 7;
      }

      // Estado de entrega y pago
      const estadoY = Math.max(leftColY, rightColY) + 5;

      doc.setFontSize(10);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont(undefined, "bold");
      doc.text("ESTADO:", 15, estadoY);

      // Estado de entrega
      const estadoEntregaText = getEstadoEntregaText(pedido.estado_entrega);
      doc.text(
        `${estadoEntregaText} | ${getEstadoPagoText(pedido.estado_pago)}`,
        70,
        estadoY
      );
      doc.setFont(undefined, "normal");

      // Monto restante si aplica
      let yPos = estadoY + 10;
      if (pedido.estado_pago === "resta_abonar") {
        doc.setFontSize(10);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(
          `Monto restante: $${Number(pedido.monto_restante).toLocaleString(
            "es-AR"
          )}`,
          15,
          yPos
        );
        yPos += 7;
      }

      // Chofer si está entregado
      if (pedido.estado_entrega === "entregado" && pedido.chofer) {
        doc.setFontSize(10);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(`Entregado por: ${pedido.chofer}`, 15, yPos);
        yPos += 7;
      }

      yPos += 5;

      // Detalle de productos - En negrita sin fondo naranja
      doc.setFontSize(12);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont(undefined, "bold");
      doc.text("DETALLE DE PRODUCTOS", 15, yPos);
      doc.setFont(undefined, "normal");

      yPos += 10;

      // Preparar datos para la tabla
      const tableColumn = [
        "Cantidad",
        "Producto",
        "Precio Unitario",
        "Subtotal",
      ];
      const tableRows = [];

      pedido.productos.forEach((producto) => {
        const productData = [
          producto.cantidad,
          producto.nombre,
          `$${Number(producto.precio_unitario).toLocaleString("es-AR")}`,
          `$${Number(producto.subtotal).toLocaleString("es-AR")}`,
        ];
        tableRows.push(productData);
      });

      // Usar autoTable como función independiente
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: yPos,
        theme: "grid",
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: secondaryColor,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 20 },
          1: { halign: "left" },
          2: { halign: "right", cellWidth: 35 },
          3: { halign: "right", cellWidth: 35 },
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      });

      // Totales - Mejorar padding/margin
      const finalY = doc.lastAutoTable.finalY + 10;

      // Ajustar el ancho y posición de los totales
      const totalsWidth = 80;
      const totalsX = doc.internal.pageSize.width - totalsWidth - 10; // 10 es el margen derecho

      let totalY = finalY;

      // Subtotal
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("Subtotal:", totalsX, totalY);

      doc.setFontSize(10);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(
        `$${Number(subtotal).toLocaleString("es-AR")}`,
        doc.internal.pageSize.width - 10,
        totalY,
        {
          align: "right",
        }
      );

      // IVA (si aplica)
      if (Number.parseFloat(ivaPorcentaje) > 0) {
        totalY += 8;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`IVA (${ivaPorcentaje}):`, totalsX, totalY);

        doc.setFontSize(10);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(
          `$${Number(ivaMonto).toLocaleString("es-AR")}`,
          doc.internal.pageSize.width - 10,
          totalY,
          {
            align: "right",
          }
        );
      }

      // Total final - En negrita sin fondo naranja
      totalY += 10;

      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("TOTAL:", totalsX, totalY);
      doc.text(
        `$${Number(total).toLocaleString("es-AR")}`,
        doc.internal.pageSize.width - 10,
        totalY,
        {
          align: "right",
        }
      );
      doc.setFont(undefined, "normal");

      // Información de contacto y términos
      const contactY = Math.max(finalY + 50, totalY + 20);

      // Línea divisoria
      doc.setDrawColor(200, 200, 200);
      doc.line(10, contactY, doc.internal.pageSize.width - 10, contactY);

      // Términos y condiciones
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(
        "Los cambios y devoluciones se aceptan dentro de las 24/48hs de la recepción de la compra.",
        10,
        contactY + 10
      );
      doc.text(
        "Los materiales o productos de segunda selección, no tienen cambio, ni devolución.",
        10,
        contactY + 15
      );

      // Información de contacto actualizada
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(
        "Casa Luongo - Materiales para la Construcción",
        10,
        contactY + 25
      );
      doc.text(
        "Tel: (011) 4209-2699 | WhatsApp 11 6633 1765",
        10,
        contactY + 30
      );
      doc.text(
        "Aristóbulo del Valle Nro. 3360 - Villa Diamante - Lanús Oeste",
        10,
        contactY + 35
      );

      // Asegurar que los términos y condiciones aparezcan al final de la última página
      doc.setPage(doc.getNumberOfPages() - 1); // Ir a la última página
      const pageHeight = doc.internal.pageSize.height;
      const currentY = doc.lastAutoTable
        ? doc.lastAutoTable.finalY + 10
        : finalY + 10;
      const footerHeight = 60; // Altura aproximada que necesitamos para el pie de página

      // Si no hay suficiente espacio en la página actual, agregar una nueva
      if (currentY + footerHeight > pageHeight - 20) {
        doc.addPage();
      }

      // Calcular la posición Y para el pie de página (cerca del final de la página)
      const footerY = pageHeight - footerHeight;

      // Línea divisoria
      doc.setDrawColor(200, 200, 200);
      doc.line(10, footerY, doc.internal.pageSize.width - 10, footerY);

      // Términos y condiciones
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(
        "Este presupuesto tiene una validez de 24 hs.",
        10,
        footerY + 10
      );
      doc.text(
        "Los precios pueden estar sujetos a modificaciones sin previo aviso.",
        10,
        footerY + 15
      );
      doc.text(
        "Los cambios y devoluciones se aceptan dentro de las 24/48hs de la recepción de la compra.",
        10,
        footerY + 20
      );
      doc.text(
        "Los materiales o productos de segunda selección, no tienen cambio, ni devolución.",
        10,
        footerY + 25
      );

      // Información de contacto actualizada
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(
        "Casa Luongo - Materiales para la Construcción",
        10,
        footerY + 35
      );
      doc.text(
        "Tel: (011) 4209-2699 | WhatsApp 11 6633 1765",
        10,
        footerY + 40
      );
      doc.text(
        "Aristóbulo del Valle Nro. 3360 - Villa Diamante - Lanús Oeste",
        10,
        footerY + 45
      );

      // Guardar el PDF
      doc.save(`Pedido_${pedido.numero}_${Date.now()}.pdf`);
      showToast("PDF generado correctamente", "success");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      showToast("Error al generar el PDF: " + error.message, "error");
    }
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

  const getEstadoPagoLabel = (estado) => {
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

  return (
    <div className="pedido-detail-container">
      {/* Modificar la sección de acciones en el header para quitar el botón de editar pedido */}
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
          <button className="btn btn-success btn-icon" onClick={generarPDF}>
            <FileDown size={20} />
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>

      <div className="pedido-detail-info">
        <div className="pedido-detail-section">
          <h3>Información del Cliente</h3>
          <div className="pedido-detail-client">
            <div className="detail-row">
              <p>
                <strong>Nombre:</strong> {pedido.nombre}
                <span className="detail-separator">|</span>
                <strong>Teléfono:</strong>{" "}
                {pedido.telefono || "No especificado"}
              </p>
            </div>
            <div className="detail-row">
              <p>
                <strong>Domicilio:</strong> {pedido.domicilio}
                <span className="detail-separator">|</span>
                <strong>Localidad:</strong>{" "}
                {pedido.localidad || "No especificada"}
              </p>
            </div>
            <div className="detail-row">
              <p>
                <strong>Entre calles:</strong>{" "}
                {pedido.entre_calles || "No especificado"}
              </p>
            </div>
          </div>
        </div>

        <div className="pedido-detail-section">
          <div className="pedido-detail-section-header">
            <h3>Detalles del Pedido</h3>
            {!editing ? (
              <button
                className="btn-edit-inline"
                onClick={() => setEditing(true)}
                title="Editar Estado"
              >
                <Edit size={16} />
                <span>Editar Estado</span>
              </button>
            ) : (
              <button
                className="btn-save-inline"
                onClick={handleSaveChanges}
                disabled={saving}
              >
                <Save size={16} />
                <span>{saving ? "Guardando..." : "Guardar"}</span>
              </button>
            )}
          </div>
          <div className="pedido-detail-meta">
            <div className="detail-row">
              <p>
                <strong>Fecha del pedido:</strong>{" "}
                {pedido.fecha_conversion
                  ? new Date(pedido.fecha_conversion).toLocaleDateString()
                  : "N/A"}
                <span className="detail-separator">|</span>
                <strong>Fecha de entrega:</strong> {mostrarFechaEntrega}
              </p>
            </div>

            {!editing ? (
              <>
                <div className="detail-row">
                  <p>
                    <strong>Estado de entrega:</strong>{" "}
                    {getEstadoEntregaText(pedido.estado_entrega)}
                    {pedido.estado_entrega === "entregado" && pedido.chofer && (
                      <>
                        <span className="detail-separator">|</span>
                        <strong>Chofer:</strong> {pedido.chofer}
                      </>
                    )}
                  </p>
                </div>
                <p>
                  <strong>Estado de pago:</strong>{" "}
                  {getEstadoPagoLabel(pedido.estado_pago)}
                </p>
                {pedido.estado_pago === "resta_abonar" && (
                  <p>
                    <strong>Monto restante:</strong> ${" "}
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
        <div className="pedido-detail-section-header">
          <h3>Detalle del Pedido</h3>
          <Link
            href={`/pedidos/${pedidoId}/editar`}
            className="btn-edit-inline"
            onClick={() =>
              console.log("Navegando a editar pedido con ID:", pedidoId)
            }
          >
            <Edit size={16} />
            <span>Editar Pedido</span>
          </Link>
        </div>
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
                $ {Number(producto.precio_unitario).toLocaleString()}
              </div>
              <div className="pedido-detail-column" data-label="Subtotal">
                $ {Number(producto.subtotal).toLocaleString()}
              </div>
            </div>
          ))}

          <div className="pedido-detail-table-footer">
            <div className="pedido-detail-total">
              <p>
                <strong>Subtotal:</strong> $ {Number(subtotal).toLocaleString()}
              </p>
              {Number.parseFloat(ivaPorcentaje) > 0 && (
                <p>
                  <strong>IVA ({ivaPorcentaje}):</strong> ${" "}
                  {Number(ivaMonto).toLocaleString()}
                </p>
              )}
              <p className="total-final">
                <strong>Total:</strong>{" "}
                <span className="total-amount">
                  $ {Number(total).toLocaleString()}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PedidoDetail;
