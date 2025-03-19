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
      doc.text("PRESUPUESTO", 105, 50, { align: "center" });

      // Número de presupuesto y fecha en el mismo renglón
      const fecha = new Date().toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const numeroPresupuesto = `P-${Date.now().toString().slice(-6)}`;

      doc.setFontSize(10);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(`NÚMERO: ${numeroPresupuesto}   |   FECHA: ${fecha}`, 105, 62, {
        align: "center",
      });

      // Información del cliente - En negrita sin fondo naranja
      doc.setFontSize(12);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont(undefined, "bold");
      doc.text("INFORMACIÓN DEL CLIENTE", 15, 75);
      doc.setFont(undefined, "normal");

      doc.setFontSize(10);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);

      // Organizar datos del cliente en dos columnas para aprovechar espacio
      let leftColY = 85;
      let rightColY = 85;
      const midPoint = doc.internal.pageSize.width / 2;

      // Columna izquierda
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

      // Columna derecha
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

      // Usar el máximo de las dos columnas para el siguiente elemento
      let yPos = Math.max(leftColY, rightColY) + 5;

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

      productos.forEach((producto) => {
        const productData = [
          producto.cantidad,
          producto.nombre,
          `$${producto.precioUnitario.toLocaleString("es-AR")}`,
          `$${producto.subtotal.toLocaleString("es-AR")}`,
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
        `$${calcularSubtotal().toLocaleString("es-AR")}`,
        doc.internal.pageSize.width - 10,
        totalY,
        {
          align: "right",
        }
      );

      // Descuento (si aplica)
      if (Number.parseFloat(opciones.descuento) > 0) {
        totalY += 8;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Descuento (${opciones.descuento}):`, totalsX, totalY);

        doc.setFontSize(10);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(
          `-$${calcularDescuento().toLocaleString("es-AR")}`,
          doc.internal.pageSize.width - 10,
          totalY,
          {
            align: "right",
          }
        );
      }

      // IVA (si aplica)
      if (Number.parseFloat(opciones.iva) > 0) {
        totalY += 8;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`IVA (${opciones.iva}):`, totalsX, totalY);

        doc.setFontSize(10);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(
          `$${calcularIVA().toLocaleString("es-AR")}`,
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
        `$${calcularTotal().toLocaleString("es-AR")}`,
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
      doc.save(`Presupuesto_${numeroPresupuesto}_${Date.now()}.pdf`);
      showToast("PDF generado correctamente", "success");
    } catch (error) {
      console.error("Error al generar PDF:", error);
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

      console.log("Enviando datos:", JSON.stringify(presupuestoData));

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
      console.error("Error al guardar presupuesto:", error);
      showToast(`Error al guardar el presupuesto: ${error.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const mostrarPreview = () => {
    setShowPreview(true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Nuevo Presupuesto</h2>
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
