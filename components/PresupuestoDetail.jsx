"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { ArrowLeft, FileDown, Edit } from "lucide-react";

const PresupuestoDetail = ({ presupuesto }) => {
  const [converting, setConverting] = useState(false);
  const [estadoPago, setEstadoPago] = useState("a_pagar");
  const [montoRestante, setMontoRestante] = useState(0);
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  // Establecer isClient a true cuando el componente se monte en el cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Función segura para formatear fechas que evita problemas de hidratación
  const formatDate = useCallback(
    (dateString) => {
      if (!isClient) {
        // En el servidor, no formateamos la fecha para evitar problemas de hidratación
        return "";
      }

      if (!dateString) return "No especificada";

      // En el cliente, formateamos la fecha con un locale específico
      const date = new Date(dateString);
      return date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    },
    [isClient]
  );

  // Función segura para formatear números que evita problemas de hidratación
  const formatNumber = useCallback(
    (number) => {
      if (!isClient) {
        // En el servidor, devolvemos el número sin formatear
        return number;
      }

      return Number(number).toLocaleString("es-AR");
    },
    [isClient]
  );

  // Agregar más logs para depuración
  useEffect(() => {
    if (presupuesto) {
      console.log(
        "PresupuestoDetail - Datos completos del presupuesto:",
        presupuesto
      );
    }
  }, [presupuesto]);

  if (!presupuesto) {
    return (
      <div className="presupuesto-detail-container">
        <div className="loading">Presupuesto no encontrado</div>
      </div>
    );
  }

  const presupuestoId = presupuesto.id;

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

      doc.setFontSize(14);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("Materiales para la Construcción", 105, 40, { align: "center" });
      doc.setFontSize(22);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("PRESUPUESTO", 105, 50, { align: "center" });

      const fecha = new Date(presupuesto.fecha_creacion).toLocaleDateString(
        "es-AR",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      );

      doc.setFontSize(10);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(`NÚMERO: ${presupuesto.numero}   |   FECHA: ${fecha}`, 105, 62, {
        align: "center",
      });

      doc.setFontSize(12);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont(undefined, "bold");
      doc.text("INFORMACIÓN DEL CLIENTE", 15, 75);
      doc.setFont(undefined, "normal");

      doc.setFontSize(10);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);

      let leftColY = 85;
      let rightColY = 85;
      const midPoint = doc.internal.pageSize.width / 2;

      doc.text(`Cliente: ${presupuesto.nombre}`, 15, leftColY);
      leftColY += 7;

      if (presupuesto.domicilio) {
        doc.text(`Domicilio: ${presupuesto.domicilio}`, 15, leftColY);
        leftColY += 7;
      }

      if (presupuesto.entre_calles) {
        doc.text(
          `Entre calles: ${presupuesto.entre_calles}`,
          midPoint + 5,
          rightColY
        );
        rightColY += 7;
      }

      if (presupuesto.telefono) {
        doc.text(`Teléfono: ${presupuesto.telefono}`, midPoint + 5, rightColY);
        rightColY += 7;
      }

      let yPos = Math.max(leftColY, rightColY) + 5;

      doc.setFontSize(12);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont(undefined, "bold");
      doc.text("DETALLE DE PRODUCTOS", 15, yPos);
      doc.setFont(undefined, "normal");

      yPos += 10;

      const tableColumn = [
        "Cantidad",
        "Producto",
        "Precio Unitario",
        "Subtotal",
      ];
      const tableRows = [];

      presupuesto.productos.forEach((producto) => {
        const productData = [
          producto.cantidad,
          producto.nombre,
          `$ ${Number(producto.precio_unitario).toLocaleString("es-AR")}`,
          `$ ${Number(producto.subtotal).toLocaleString("es-AR")}`,
        ];
        tableRows.push(productData);
      });

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

      const finalY = doc.lastAutoTable.finalY + 10;

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
        `$ ${Number(subtotal).toLocaleString("es-AR")}`,
        doc.internal.pageSize.width - 10,
        totalY,
        {
          align: "right",
        }
      );

      // IVA (si aplica)
      if (Number(ivaPorcentaje) > 0) {
        totalY += 8;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`IVA (${presupuesto.iva_porcentaje}):`, totalsX, totalY);

        doc.setFontSize(10);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(
          `$ ${Number(ivaMonto).toLocaleString("es-AR")}`,
          doc.internal.pageSize.width - 10,
          totalY,
          {
            align: "right",
          }
        );
      }

      // Descuento (si aplica)
      if (Number(descuentoPorcentaje) > 0) {
        totalY += 8;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Descuento (${presupuesto.descuento_porcentaje}):`,
          totalsX,
          totalY
        );

        doc.setFontSize(10);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(
          `-$ ${Number(descuentoMonto).toLocaleString("es-AR")}`,
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
        `$ ${Number(total).toLocaleString("es-AR")}`,
        doc.internal.pageSize.width - 10,
        totalY,
        {
          align: "right",
        }
      );
      doc.setFont(undefined, "normal");

      // Información de contacto y términos
      const contactY = Math.max(finalY + 50, totalY + 20);

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
      doc.save(`Presupuesto_${presupuesto.numero}_${Date.now()}.pdf`);
      showToast("PDF generado correctamente", "success");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      showToast("Error al generar el PDF: " + error.message, "error");
    }
  };

  const handleConvertirClick = () => {
    setEstadoPago("a_pagar");
    setMontoRestante(0);
    setFechaEntrega("");
    setShowConvertForm(true);
  };

  const handleCancelarConversion = () => {
    setShowConvertForm(false);
  };

  // Modificar la función convertirAPedido para corregir el manejo de fechas
  const convertirAPedido = async () => {
    try {
      setConverting(true);

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
            "Fecha de entrega corregida en convertirAPedido:",
            fechaEntregaCorregida
          );
        }
      }

      const data = {
        estado_pago: estadoPago,
        monto_restante: estadoPago === "resta_abonar" ? montoRestante : 0,
        fecha_entrega: fechaEntregaCorregida || null,
      };

      console.log(
        "Enviando datos para convertir presupuesto:",
        JSON.stringify(data)
      );
      console.log("ID del presupuesto a convertir:", presupuestoId);

      const response = await fetch(
        `/api/presupuestos/${presupuestoId}/convertir-a-pedido`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al convertir el presupuesto");
      }

      const result = await response.json();
      console.log("Resultado de la conversión:", result);

      showToast("Presupuesto convertido a pedido correctamente", "success");
      router.push(`/pedidos/${result.id}`);
    } catch (error) {
      console.error("Error al convertir presupuesto:", error);
      showToast(`Error al convertir el presupuesto: ${error.message}`, "error");
    } finally {
      setConverting(false);
      setShowConvertForm(false);
    }
  };

  const handleConfirmConversion = () => {
    convertirAPedido();
  };

  // Calcular subtotal, IVA y descuento
  const subtotal =
    presupuesto.subtotal ||
    presupuesto.productos.reduce(
      (acc, producto) => acc + Number(producto.subtotal),
      0
    );
  const ivaPorcentaje = presupuesto.iva_porcentaje?.replace("%", "") || 0;
  const ivaMonto = presupuesto.iva_monto || 0;
  const descuentoPorcentaje =
    presupuesto.descuento_porcentaje?.replace("%", "") || 0;
  const descuentoMonto = presupuesto.descuento_monto || 0;

  // Asegurarse de que el total sea correcto
  const total = presupuesto.total || subtotal + ivaMonto - descuentoMonto;

  // Añadir logs para depuración
  useEffect(() => {
    if (isClient && presupuesto) {
      console.log("Valores para cálculos:");
      console.log("Subtotal:", subtotal);
      console.log("IVA %:", ivaPorcentaje);
      console.log("IVA monto:", ivaMonto);
      console.log("Descuento %:", descuentoPorcentaje);
      console.log("Descuento monto:", descuentoMonto);
      console.log("Total calculado:", total);
      console.log("Total del presupuesto:", presupuesto.total);
    }
  }, [
    isClient,
    presupuesto,
    subtotal,
    ivaPorcentaje,
    ivaMonto,
    descuentoPorcentaje,
    descuentoMonto,
    total,
  ]);

  return (
    <div className="presupuesto-detail-container">
      <div className="presupuesto-detail-header">
        <h2>Presupuesto #{presupuesto.numero}</h2>
        <div className="presupuesto-detail-actions">
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

      {/* Modal para convertir a pedido */}
      {showConvertForm && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Convertir a Pedido</h3>
            </div>
            <div className="modal-body">
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
                    min="0"
                    step="1"
                  />
                </div>
              )}

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
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowConvertForm(false)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmConversion}
                disabled={converting}
              >
                {converting ? "Convirtiendo..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="presupuesto-detail-info">
        <div className="presupuesto-detail-section">
          <h3>Información del Cliente</h3>
          <div className="presupuesto-detail-client">
            <p>
              <strong>Nombre:</strong> {presupuesto.nombre}{" "}
              <span className="detail-separator">|</span>{" "}
              <strong>Teléfono:</strong>{" "}
              {presupuesto.telefono || "No especificado"}
            </p>
            <p>
              <strong>Domicilio:</strong> {presupuesto.domicilio}{" "}
              <span className="detail-separator">|</span>{" "}
              <strong>Localidad:</strong>{" "}
              {presupuesto.localidad || "No especificada"}
            </p>
            <p>
              <strong>Entre calles:</strong>{" "}
              {presupuesto.entre_calles || "No especificado"}
            </p>
          </div>
        </div>

        <div className="presupuesto-detail-section">
          <div className="pedido-detail-section-header">
            <h3>Detalles del Presupuesto</h3>
            <button
              className="btn-edit-inline"
              onClick={handleConvertirClick}
              title="Convertir a Pedido"
            >
              <Edit size={16} />
              <span>Convertir a Pedido</span>
            </button>
          </div>
          <div className="presupuesto-detail-meta">
            <p>
              <strong>Fecha:</strong>{" "}
              {isClient ? formatDate(presupuesto.fecha_creacion) : ""}
            </p>
            <p>
              <strong>Estado:</strong> Presupuesto
            </p>
            <p>
              <strong>IVA:</strong> {presupuesto.iva_porcentaje || "0%"}{" "}
              <span className="detail-separator">|</span>{" "}
              <strong>Descuento:</strong>{" "}
              {presupuesto.descuento_porcentaje || "0%"}
            </p>
          </div>
        </div>
      </div>

      <div className="presupuesto-detail-products">
        <div className="pedido-detail-section-header">
          <h3>Detalle del Presupuesto</h3>
          <Link
            href={`/presupuestos/${presupuestoId}/editar`}
            className="btn-edit-inline"
            onClick={() =>
              console.log(
                "Navegando a editar presupuesto con ID:",
                presupuestoId
              )
            }
          >
            <Edit size={16} />
            <span>Editar Presupuesto</span>
          </Link>
        </div>
        <div className="presupuesto-detail-table">
          <div className="presupuesto-detail-table-header">
            <div className="presupuesto-detail-column text-center">
              Cantidad
            </div>
            <div className="presupuesto-detail-column product-name text-center">
              Producto
            </div>
            <div className="presupuesto-detail-column text-center">
              Precio Unitario
            </div>
            <div className="presupuesto-detail-column text-center">
              Subtotal
            </div>
          </div>

          {presupuesto.productos.map((producto) => (
            <div key={producto.id} className="presupuesto-detail-table-row">
              <div className="presupuesto-detail-column" data-label="Cantidad">
                {producto.cantidad}
              </div>
              <div
                className="presupuesto-detail-column product-name"
                data-label="Producto"
              >
                {producto.nombre}
              </div>
              <div
                className="presupuesto-detail-column"
                data-label="Precio Unitario"
              >
                ${" "}
                {isClient
                  ? formatNumber(producto.precio_unitario)
                  : producto.precio_unitario}
              </div>
              <div className="presupuesto-detail-column" data-label="Subtotal">
                ${" "}
                {isClient ? formatNumber(producto.subtotal) : producto.subtotal}
              </div>
            </div>
          ))}

          <div className="presupuesto-detail-table-footer">
            <div className="presupuesto-detail-total">
              <p>
                <strong>Subtotal:</strong> ${" "}
                {isClient ? formatNumber(subtotal) : subtotal}
              </p>
              {Number(ivaPorcentaje) > 0 && (
                <p>
                  <strong>IVA ({presupuesto.iva_porcentaje}):</strong> ${" "}
                  {isClient ? formatNumber(ivaMonto) : ivaMonto}
                </p>
              )}
              {Number(descuentoPorcentaje) > 0 && (
                <p>
                  <strong>
                    Descuento ({presupuesto.descuento_porcentaje}):
                  </strong>{" "}
                  $ {isClient ? formatNumber(descuentoMonto) : descuentoMonto}
                </p>
              )}
              <p className="total-final">
                <strong>Total:</strong>{" "}
                <span className="total-amount">
                  $ {isClient ? formatNumber(total) : total}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresupuestoDetail;
