"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ClienteForm from "./ClienteForm";
import OpcionesForm from "./OpcionesForm";
import ProductForm from "./ProductForm";
import ProductList from "./ProductList";
import { useToast } from "@/hooks/use-toast";
import { Save, FileDown, ArrowLeft, User, Percent } from "lucide-react";
import styles from "@/styles/PresupuestoForm.module.css";
import productListStyles from "@/styles/ProductList.module.css";

const PresupuestoForm = () => {
  const [productos, setProductos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showClienteForm, setShowClienteForm] = useState(false);
  const [showOpcionesForm, setShowOpcionesForm] = useState(false);
  const [cliente, setCliente] = useState({
    nombre: "Consumidor Final",
    domicilio: "",
    entreCalles: "",
    telefono: "",
    localidad: "",
  });
  const [opciones, setOpciones] = useState({
    iva: "0%",
    descuento: "0%",
  });
  const router = useRouter();
  const { showToast } = useToast();
  const [showPreview, setShowPreview] = useState(false);

  const agregarProducto = (producto) => {
    const productoExistente = productos.find(
      (p) => p.nombre === producto.nombre
    );

    if (productoExistente) {
      setProductos(
        productos.map((p) =>
          p.nombre === producto.nombre
            ? { ...p, cantidad: p.cantidad + producto.cantidad }
            : p
        )
      );
    } else {
      setProductos([
        ...productos,
        {
          ...producto,
          id: Date.now(),
          subtotal: producto.cantidad * producto.precioUnitario,
        },
      ]);
    }
  };

  const eliminarProducto = (id) => {
    setProductos(productos.filter((producto) => producto.id !== id));
  };

  const calcularSubtotal = () => {
    return productos.reduce((total, producto) => total + producto.subtotal, 0);
  };

  const calcularDescuento = () => {
    const subtotal = calcularSubtotal();
    const descuentoRate = Number.parseFloat(opciones.descuento) / 100;
    return subtotal * descuentoRate;
  };

  const calcularIVA = () => {
    const subtotal = calcularSubtotal();
    const descuento = calcularDescuento();
    const baseImponible = subtotal - descuento;
    const ivaRate = Number.parseFloat(opciones.iva) / 100;
    return baseImponible * ivaRate;
  };

  const calcularTotal = () => {
    const subtotal = calcularSubtotal();
    const descuento = calcularDescuento();
    const iva = calcularIVA();
    return subtotal - descuento + iva;
  };

  const handleClienteChange = (nuevoCliente) => {
    setCliente({ ...cliente, ...nuevoCliente });
  };

  const handleOpcionesChange = (nuevasOpciones) => {
    setOpciones({ ...opciones, ...nuevasOpciones });
  };

  const generarPDF = async () => {
    if (productos.length === 0) {
      showToast("Debe agregar al menos un producto", "error");
      return;
    }

    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();

      const primaryColor = [255, 102, 0];
      const secondaryColor = [74, 109, 167];
      const textColor = [51, 51, 51];

      // Logo
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
      doc.setTextColor(...secondaryColor);
      doc.text("Materiales para la Construcción", 105, 40, { align: "center" });
      doc.setFontSize(22);
      doc.setTextColor(...primaryColor);
      doc.text("PRESUPUESTO", 105, 50, { align: "center" });
      const textWidth = doc.getTextWidth("PRESUPUESTO");
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(105 - textWidth / 2, 52, 105 + textWidth / 2, 52);

      const fecha = new Date().toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const numeroPresupuesto = `${Date.now().toString().slice(-6)}`;

      doc.setFontSize(10);
      doc.setTextColor(...textColor);
      doc.text(`Presupuesto Nro.: ${numeroPresupuesto}`, 15, 62);
      doc.text(`FECHA: ${fecha}`, doc.internal.pageSize.width - 15, 62, {
        align: "right",
      });

      doc.setFontSize(12);
      doc.setTextColor(...textColor);
      doc.setFont(undefined, "bold");
      doc.text("INFORMACIÓN DEL CLIENTE", 15, 75);
      doc.setFont(undefined, "normal");

      doc.setFontSize(10);
      doc.setTextColor(...textColor);

      let leftColY = 85;
      let rightColY = 85;
      const midPoint = doc.internal.pageSize.width / 2;

      doc.text(`Cliente: ${cliente.nombre}`, 15, leftColY);
      leftColY += 7;

      if (cliente.domicilio) {
        doc.text(`Domicilio: ${cliente.domicilio}`, 15, leftColY);
        leftColY += 7;
      }

      if (cliente.localidad) {
        doc.text(`Localidad: ${cliente.localidad}`, 15, leftColY);
        leftColY += 7;
      }

      if (cliente.entreCalles) {
        doc.text(
          `Entre calles: ${cliente.entreCalles}`,
          midPoint + 5,
          rightColY
        );
        rightColY += 7;
      }

      if (cliente.telefono) {
        doc.text(`Teléfono: ${cliente.telefono}`, midPoint + 5, rightColY);
        rightColY += 7;
      }

      let yPos = Math.max(leftColY, rightColY) + 5;

      doc.setFontSize(12);
      doc.setTextColor(...textColor);
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
      const tableRows = productos.map((producto) => [
        producto.cantidad,
        producto.nombre,
        `$${producto.precioUnitario.toLocaleString("es-AR")}`,
        `$${producto.subtotal.toLocaleString("es-AR")}`,
      ]);

      // Totales
      const subtotal = calcularSubtotal();
      const ivaPorcentaje = opciones.iva?.replace("%", "") || 0;
      const ivaMonto = calcularIVA();
      const descuentoPorcentaje = opciones.descuento?.replace("%", "") || 0;
      const descuentoMonto = calcularDescuento();
      const total = calcularTotal();

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

      if (tableRows.length <= 10) {
        let lastTableFinalY = 0;
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
        });

        // Totales
        let yTotales = lastTableFinalY + 10;
        const totalsWidth = 80;
        const totalsX = doc.internal.pageSize.width - totalsWidth - 10;

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text("Subtotal:", totalsX, yTotales);
        doc.setFontSize(10);
        doc.setTextColor(...textColor);
        doc.text(
          `$${subtotal.toLocaleString("es-AR")}`,
          doc.internal.pageSize.width - 10,
          yTotales,
          { align: "right" }
        );

        if (Number(descuentoPorcentaje) > 0) {
          yTotales += 8;
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text(`Descuento (${opciones.descuento}):`, totalsX, yTotales);
          doc.setFontSize(10);
          doc.setTextColor(...textColor);
          doc.text(
            `-$${descuentoMonto.toLocaleString("es-AR")}`,
            doc.internal.pageSize.width - 10,
            yTotales,
            { align: "right" }
          );
        }

        if (Number(ivaPorcentaje) > 0) {
          yTotales += 8;
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text(`IVA (${opciones.iva}):`, totalsX, yTotales);
          doc.setFontSize(10);
          doc.setTextColor(...textColor);
          doc.text(
            `$${ivaMonto.toLocaleString("es-AR")}`,
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
          `$${total.toLocaleString("es-AR")}`,
          doc.internal.pageSize.width - 10,
          yTotales,
          { align: "right" }
        );
        doc.setFont(undefined, "normal");

        addLeyendaFooter(doc);
      } else {
        // Más de 10 items: primera hoja con 10, segunda hoja con el resto y totales/leyenda
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
        });

        addLeyendaFooter(doc);

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
        });

        // Totales en la segunda hoja
        let yTotales = lastTableFinalY2 + 10;
        const totalsWidth = 80;
        const totalsX = doc.internal.pageSize.width - totalsWidth - 10;

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text("Subtotal:", totalsX, yTotales);
        doc.setFontSize(10);
        doc.setTextColor(...textColor);
        doc.text(
          `$${subtotal.toLocaleString("es-AR")}`,
          doc.internal.pageSize.width - 10,
          yTotales,
          { align: "right" }
        );

        if (Number(descuentoPorcentaje) > 0) {
          yTotales += 8;
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text(`Descuento (${opciones.descuento}):`, totalsX, yTotales);
          doc.setFontSize(10);
          doc.setTextColor(...textColor);
          doc.text(
            `-$${descuentoMonto.toLocaleString("es-AR")}`,
            doc.internal.pageSize.width - 10,
            yTotales,
            { align: "right" }
          );
        }

        if (Number(ivaPorcentaje) > 0) {
          yTotales += 8;
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text(`IVA (${opciones.iva}):`, totalsX, yTotales);
          doc.setFontSize(10);
          doc.setTextColor(...textColor);
          doc.text(
            `$${ivaMonto.toLocaleString("es-AR")}`,
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
          `$${total.toLocaleString("es-AR")}`,
          doc.internal.pageSize.width - 10,
          yTotales,
          { align: "right" }
        );
        doc.setFont(undefined, "normal");

        addLeyendaFooter(doc);
      }

      doc.save(`Presupuesto_${numeroPresupuesto}_${Date.now()}.pdf`);
      showToast("PDF generado correctamente", "success");
    } catch (error) {
      showToast("Error al generar el PDF: " + error.message, "error");
    }
  };

  const guardarPresupuesto = async () => {
    if (productos.length === 0) {
      showToast("Debe agregar al menos un producto", "error");
      return;
    }

    try {
      setSaving(true);

      const presupuestoData = {
        cliente: {
          ...cliente,
          iva: opciones.iva,
        },
        productos,
        subtotal: calcularSubtotal(),
        descuento_porcentaje: opciones.descuento,
        descuento_monto: calcularDescuento(),
        iva_monto: calcularIVA(),
        total: calcularTotal(),
        iva_porcentaje: opciones.iva,
      };

      const response = await fetch("/api/presupuestos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(presupuestoData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.error || "Error al guardar el presupuesto"
        );
      }

      showToast("Presupuesto guardado correctamente", "success");
      router.push(`/presupuestos/${responseData.id}`);
    } catch (error) {
      showToast(`Error al guardar el presupuesto: ${error.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Nuevo Presupuestos</h2>
        <div className={styles.headerActions}>
          <button
            className={styles.clientButton}
            onClick={() => setShowClienteForm(!showClienteForm)}
            title="Datos del cliente"
          >
            <User size={20} />
          </button>
          <button
            className={styles.optionsButton}
            onClick={() => setShowOpcionesForm(!showOpcionesForm)}
            title="Opciones de IVA y descuento"
          >
            <Percent size={20} />
          </button>
        </div>
      </div>

      {showClienteForm && (
        <ClienteForm cliente={cliente} onChange={handleClienteChange} />
      )}

      {showOpcionesForm && (
        <OpcionesForm
          iva={opciones.iva}
          descuento={opciones.descuento}
          onChange={handleOpcionesChange}
        />
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>CARGAR PRODUCTOS</h2>
        <ProductForm onAgregarProducto={agregarProducto} />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>PEDIDO</h2>
        {productos.length > 0 ? (
          <>
            <ProductList
              productos={productos}
              onEliminarProducto={eliminarProducto}
            />
            <div className={productListStyles.totalContainer}>
              <div className={productListStyles.totalDetails}>
                <p className={productListStyles.subtotal}>
                  Subtotal:{" "}
                  <span className={productListStyles.amount}>
                    ${calcularSubtotal().toLocaleString()}
                  </span>
                </p>
                {Number.parseFloat(opciones.descuento) > 0 && (
                  <p className={productListStyles.descuento}>
                    Descuento ({opciones.descuento}):{" "}
                    <span className={productListStyles.amount}>
                      -${calcularDescuento().toLocaleString()}
                    </span>
                  </p>
                )}
                {Number.parseFloat(opciones.iva) > 0 && (
                  <p className={productListStyles.iva}>
                    IVA ({opciones.iva}):{" "}
                    <span className={productListStyles.amount}>
                      ${calcularIVA().toLocaleString()}
                    </span>
                  </p>
                )}
                <p className={productListStyles.total}>
                  Total:{" "}
                  <span className={productListStyles.totalAmount}>
                    ${calcularTotal().toLocaleString()}
                  </span>
                </p>
              </div>
            </div>
          </>
        ) : (
          <p className={styles.noProductos}>No hay productos seleccionados</p>
        )}

        <div className={styles.actionButtons}>
          <button
            className="btn btn-secondary btn-icon"
            onClick={() => router.back()}
          >
            <ArrowLeft size={20} />
            <span>Cancelar</span>
          </button>
          <button
            className="btn btn-success btn-icon"
            onClick={generarPDF}
            disabled={productos.length === 0}
            title="Descargar PDF sin guardar"
          >
            <FileDown size={20} />
            <span>Descargar PDF</span>
          </button>
          <button
            className="btn btn-primary btn-icon"
            onClick={guardarPresupuesto}
            disabled={productos.length === 0 || saving}
          >
            <Save size={20} />
            <span>{saving ? "Guardando..." : "Guardar Presupuesto"}</span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default PresupuestoForm;
