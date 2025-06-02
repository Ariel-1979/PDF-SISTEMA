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
  useEffect(() => {}, [pedido]);

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

  const pedidoId = pedido.id;

  const subtotal = pedido.subtotal || pedido.total;
  const ivaPorcentaje = pedido.iva_porcentaje || "0%";
  const descuentoPorcentaje = pedido.descuento_porcentaje || "0%";
  const descuentoMonto = pedido.descuento_monto || 0;
  const ivaMonto = pedido.iva_monto || 0;
  const total = pedido.total;

  // Generar PDF con salto de página después del ítem 10
  const generarPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();

      const primaryColor = [255, 102, 0];
      const secondaryColor = [74, 109, 167];
      const textColor = [51, 51, 51];

      // --- LOGO ---
      const logoImg = new window.Image();
      logoImg.src =
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo_Luongo-2yJWkbBhykRbk43ImjzWGhnPvuw3uR.png";
      await new Promise((resolve) => {
        logoImg.onload = resolve;
      });
      const imgWidth = 50;
      const imgHeight = (logoImg.height * imgWidth) / logoImg.width;
      doc.addImage(
        logoImg,
        "PNG",
        (doc.internal.pageSize.width - imgWidth) / 2,
        10,
        imgWidth,
        imgHeight
      );

      // --- HEADER ---
      doc.setFontSize(14);
      doc.setTextColor(...secondaryColor);
      doc.text("Materiales para la Construcción", 105, 40, { align: "center" });

      doc.setFontSize(22);
      doc.setTextColor(...primaryColor);
      doc.text("PEDIDO", 105, 50, { align: "center" });
      const textWidth = doc.getTextWidth("PEDIDO");
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(105 - textWidth / 2, 52, 105 + textWidth / 2, 52);

      const fecha = new Date(
        pedido.fecha_conversion || pedido.fecha_creacion
      ).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      doc.setFontSize(10);
      doc.setTextColor(...textColor);
      doc.text(`Pedido Nro.: ${pedido.numero}`, 15, 62);
      doc.text(`FECHA: ${fecha}`, doc.internal.pageSize.width - 15, 62, {
        align: "right",
      });

      // Fecha de entrega si existe
      if (pedido.fecha_entrega) {
        doc.text(
          `FECHA DE ENTREGA: ${new Date(
            pedido.fecha_entrega
          ).toLocaleDateString("es-AR")}`,
          doc.internal.pageSize.width - 15,
          68,
          {
            align: "right",
          }
        );
      }

      // --- INFORMACIÓN DEL CLIENTE ---
      doc.setFontSize(12);
      doc.setTextColor(...textColor);
      doc.setFont(undefined, "bold");
      doc.text("INFORMACIÓN DEL CLIENTE", 15, 80);
      doc.setFont(undefined, "normal");

      doc.setFontSize(10);
      doc.setTextColor(...textColor);
      let leftColY = 90;
      let rightColY = 90;
      const midPoint = doc.internal.pageSize.width / 2;
      doc.text(`Cliente: ${pedido.nombre}`, 15, leftColY);
      leftColY += 7;
      if (pedido.domicilio) {
        doc.text(`Domicilio: ${pedido.domicilio}`, 15, leftColY);
        leftColY += 7;
      }
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

      // --- ESTADO ---
      const estadoY = Math.max(leftColY, rightColY) + 5;
      doc.setFontSize(10);
      doc.setTextColor(...textColor);
      doc.setFont(undefined, "bold");
      doc.text("ESTADO:", 15, estadoY);
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
        doc.setTextColor(...textColor);
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
        doc.setTextColor(...textColor);
        doc.text(`Entregado por: ${pedido.chofer}`, 15, yPos);
        yPos += 7;
      }
      yPos += 5;

      // --- DETALLE DE PRODUCTOS ---
      doc.setFontSize(12);
      doc.setTextColor(...textColor);
      doc.setFont(undefined, "bold");
      doc.text("DETALLE DE PRODUCTOS", 15, yPos);
      doc.setFont(undefined, "normal");
      yPos += 10;

      // --- TABLA DE PRODUCTOS ---
      const tableColumn = [
        "Cantidad",
        "Producto",
        "Precio Unitario",
        "Subtotal",
      ];
      const productos = pedido.productos || [];
      const tableRows = productos.map((producto) => [
        producto.cantidad,
        producto.nombre,
        `$${Number(producto.precio_unitario).toLocaleString("es-AR")}`,
        `$${Number(producto.subtotal).toLocaleString("es-AR")}`,
      ]);

      // Leyenda footer
      const addLeyendaFooter = (doc) => {
        const pageHeight = doc.internal.pageSize.height;
        const footerY = pageHeight - 60;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.line(10, footerY, doc.internal.pageSize.width - 10, footerY);

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

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        const pageCenter = doc.internal.pageSize.width / 2;
        doc.text(
          "Casa Luongo - Materiales para la Construcción",
          pageCenter,
          footerY + 35,
          { align: "center" }
        );
        doc.text(
          "Tel: (011) 4209-2699 | WhatsApp 11 6633 1765",
          pageCenter,
          footerY + 40,
          { align: "center" }
        );
        doc.text(
          "Aristóbulo del Valle Nro. 3360 - Villa Diamante - Lanús Oeste",
          pageCenter,
          footerY + 45,
          { align: "center" }
        );
      };

      // --- MANEJO DE SALTO DE PÁGINA EN EL ÍTEM 10 ---
      let lastTableFinalY = 0;
      if (tableRows.length <= 10) {
        // Si hay 10 o menos ítems, todo en una hoja
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
          pageBreak: "auto",
          bodyStyles: {},
          rowPageBreak: "auto",
          didDrawCell: function (data) {
            if (data.row.index === tableRows.length - 1) {
              lastTableFinalY = data.cell.y + data.cell.height;
            }
          },
          didDrawPage: function () {
            addLeyendaFooter(doc);
            doc.setFontSize(8);
            doc.setTextColor(120, 120, 120);
            const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
            const totalPages = doc.internal.getNumberOfPages();
            doc.text(
              `Página ${pageNumber} de ${totalPages}`,
              doc.internal.pageSize.width - 10,
              doc.internal.pageSize.height - 10,
              { align: "right" }
            );
          },
        });
      } else {
        // Más de 10 ítems: primera hoja con 10, segunda hoja con el resto
        const firstPageRows = tableRows.slice(0, 10);
        const secondPageRows = tableRows.slice(10);

        // --- Primera hoja ---
        autoTable(doc, {
          head: [tableColumn],
          body: firstPageRows,
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
          pageBreak: "never",
          bodyStyles: {},
          rowPageBreak: "auto",
          didDrawPage: function () {
            addLeyendaFooter(doc);
            doc.setFontSize(8);
            doc.setTextColor(120, 120, 120);
            const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
            const totalPages = doc.internal.getNumberOfPages();
            doc.text(
              `Página ${pageNumber} de ${totalPages}`,
              doc.internal.pageSize.width - 10,
              doc.internal.pageSize.height - 10,
              { align: "right" }
            );
          },
        });

        // --- Segunda hoja ---
        doc.addPage();

        // Encabezado de tabla en segunda hoja
        let ySecondPage = 30;
        doc.setFontSize(12);
        doc.setTextColor(...textColor);
        doc.setFont(undefined, "bold");
        doc.text("DETALLE DE PRODUCTOS (continuación)", 15, ySecondPage);
        doc.setFont(undefined, "normal");
        ySecondPage += 10;

        let lastTableFinalY2 = 0;
        autoTable(doc, {
          head: [tableColumn],
          body: secondPageRows,
          startY: ySecondPage,
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
          pageBreak: "auto",
          bodyStyles: {},
          rowPageBreak: "auto",
          didDrawCell: function (data) {
            if (data.row.index === secondPageRows.length - 1) {
              lastTableFinalY2 = data.cell.y + data.cell.height;
            }
          },
          didDrawPage: function () {
            addLeyendaFooter(doc);
            doc.setFontSize(8);
            doc.setTextColor(120, 120, 120);
            const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
            const totalPages = doc.internal.getNumberOfPages();
            doc.text(
              `Página ${pageNumber} de ${totalPages}`,
              doc.internal.pageSize.width - 10,
              doc.internal.pageSize.height - 10,
              { align: "right" }
            );
          },
        });

        lastTableFinalY = lastTableFinalY2;
      }

      // Totales sólo en la última hoja
      const totalPages = doc.internal.getNumberOfPages();
      doc.setPage(totalPages);
      let yTotales = lastTableFinalY + 10;
      if (yTotales > doc.internal.pageSize.height - 70) {
        doc.addPage();
        yTotales = 30;
        addLeyendaFooter(doc);
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Página ${
            doc.internal.getCurrentPageInfo().pageNumber
          } de ${doc.internal.getNumberOfPages()}`,
          doc.internal.pageSize.width - 10,
          doc.internal.pageSize.height - 10,
          { align: "right" }
        );
      }
      const totalsWidth = 80;
      const totalsX = doc.internal.pageSize.width - totalsWidth - 10;

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("Subtotal:", totalsX, yTotales);
      doc.setFontSize(10);
      doc.setTextColor(...textColor);
      doc.text(
        `$${Number(subtotal).toLocaleString("es-AR")}`,
        doc.internal.pageSize.width - 10,
        yTotales,
        { align: "right" }
      );

      if (Number.parseFloat(ivaPorcentaje) > 0) {
        yTotales += 8;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`IVA (${ivaPorcentaje}):`, totalsX, yTotales);
        doc.setFontSize(10);
        doc.setTextColor(...textColor);
        doc.text(
          `$${Number(ivaMonto).toLocaleString("es-AR")}`,
          doc.internal.pageSize.width - 10,
          yTotales,
          { align: "right" }
        );
      }

      if (
        Number(descuentoMonto) > 0 ||
        (descuentoPorcentaje &&
          Number(descuentoPorcentaje.replace("%", "")) > 0)
      ) {
        yTotales += 8;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Descuento (${descuentoPorcentaje}):`, totalsX, yTotales);
        doc.setFontSize(10);
        doc.setTextColor(...textColor);
        doc.text(
          `-$${Number(descuentoMonto).toLocaleString("es-AR")}`,
          doc.internal.pageSize.width - 10,
          yTotales,
          { align: "right" }
        );
      }

      yTotales += 10;
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.setTextColor(...primaryColor);
      doc.text("TOTAL:", totalsX, yTotales);
      doc.text(
        `$${Number(total).toLocaleString("es-AR")}`,
        doc.internal.pageSize.width - 10,
        yTotales,
        { align: "right" }
      );
      doc.setFont(undefined, "normal");

      doc.save(`Pedido_${pedido.numero}_${Date.now()}.pdf`);
      showToast("PDF generado correctamente", "success");
    } catch (error) {
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

      let fechaEntregaCorregida = fechaEntrega;
      if (fechaEntrega) {
        const fecha = new Date(fechaEntrega);

        const añoActual = new Date().getFullYear();

        if (fecha.getFullYear() !== añoActual) {
          fecha.setFullYear(añoActual);

          fechaEntregaCorregida = fecha.toISOString().split("T")[0];
        }
      }

      const data = {
        chofer: estadoEntrega === "entregado" ? chofer : null,
        estado_entrega: estadoEntrega,
        estado_pago: estadoPago,
        monto_restante: estadoPago === "resta_abonar" ? montoRestante : 0,
        fecha_entrega: fechaEntregaCorregida || null,
      };

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
      showToast(`Error al actualizar el pedido: ${error.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

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
              {Number.parseFloat(descuentoPorcentaje) > 0 && (
                <p>
                  <strong>DESCUENTO ({descuentoPorcentaje}):</strong> ${" "}
                  {Number(descuentoMonto).toLocaleString()}
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
