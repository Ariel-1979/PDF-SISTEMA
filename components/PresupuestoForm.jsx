"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ClienteForm from "./ClienteForm";
import OpcionesForm from "./OpcionesForm";
import ProductForm from "./ProductForm";
import ProductList from "./ProductList";
import PdfPreview from "./PdfPreview";
import { useToast } from "@/hooks/use-toast";
import { Save, FileDown, Eye, ArrowLeft, User, Percent } from "lucide-react";
import styles from "@/styles/PresupuestoForm.module.css";
import productListStyles from "@/styles/ProductList.module.css";

const PresupuestoForm = () => {
  const [productos, setProductos] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
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

      const doc = new jsPDF();

      // Título
      doc.setFontSize(22);
      doc.text("Casa Luongo - Presupuesto", 105, 20, { align: "center" });

      // Información del cliente
      doc.setFontSize(12);
      doc.text(`Cliente: ${cliente.nombre}`, 20, 40);
      doc.text(`Domicilio: ${cliente.domicilio}`, 20, 50);
      if (cliente.localidad) {
        doc.text(`Localidad: ${cliente.localidad}`, 20, 60);
      }
      doc.text(`Entre calles: ${cliente.entreCalles}`, 20, 70);
      doc.text(`Teléfono: ${cliente.telefono}`, 20, 80);
      doc.text(`IVA: ${opciones.iva}`, 20, 90);

      // Fecha
      const fecha = new Date().toLocaleDateString();
      doc.text(`Fecha: ${fecha}`, 150, 40);

      // Tabla de productos
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
          `$${producto.precioUnitario.toLocaleString()}`,
          `$${producto.subtotal.toLocaleString()}`,
        ];
        tableRows.push(productData);
      });

      // Usar autoTable como función independiente en lugar de método
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 100,
        theme: "grid",
        styles: { fontSize: 10, halign: "center" },
        headStyles: { fillColor: [255, 102, 0], halign: "center" },
        columnStyles: {
          0: { halign: "center" },
          1: { halign: "left" },
          2: { halign: "right" },
          3: { halign: "right" },
        },
      });

      // Total
      const finalY = doc.lastAutoTable.finalY || 100;
      let currentY = finalY + 10;

      // Subtotal
      doc.text(
        `Subtotal: $${calcularSubtotal().toLocaleString()}`,
        150,
        currentY,
        { align: "right" }
      );
      currentY += 8;

      // Descuento (si aplica)
      if (Number.parseFloat(opciones.descuento) > 0) {
        doc.text(
          `Descuento (${
            opciones.descuento
          }): -$${calcularDescuento().toLocaleString()}`,
          150,
          currentY,
          {
            align: "right",
          }
        );
        currentY += 8;
      }

      // IVA (si aplica)
      if (Number.parseFloat(opciones.iva) > 0) {
        doc.text(
          `IVA (${opciones.iva}): $${calcularIVA().toLocaleString()}`,
          150,
          currentY,
          { align: "right" }
        );
        currentY += 8;
      }

      // Total final
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text(`Total: $${calcularTotal().toLocaleString()}`, 150, currentY, {
        align: "right",
      });
      doc.setFont(undefined, "normal");
      doc.setFontSize(12);

      // Términos y condiciones
      currentY += 20;
      doc.setFontSize(8);
      doc.text("Este presupuesto tiene una validez de 24 hs.", 20, currentY);
      currentY += 5;
      doc.text(
        "Los precios pueden estar sujetos a modificaciones sin previo aviso.",
        20,
        currentY
      );
      currentY += 5;
      doc.text(
        "Los cambios y devoluciones se aceptan dentro de las 24/48hs de la recepción de la compra.",
        20,
        currentY
      );
      currentY += 5;
      doc.text(
        "Los materiales o productos de segunda selección, no tienen cambio, ni devolución.",
        20,
        currentY
      );

      // Guardar el PDF
      doc.save(`presupuesto-casa-luongo-${Date.now()}.pdf`);
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
      {!showPreview ? (
        <>
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
              <p className={styles.noProductos}>
                No hay productos seleccionados
              </p>
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
                className="btn btn-descargar btn-icon"
                onClick={generarPDF}
                disabled={productos.length === 0}
                title="Descargar PDF sin guardar"
              >
                <FileDown size={20} />
                <span>Descargar PDF</span>
              </button>
              <button
                className="btn btn-preview btn-icon"
                onClick={mostrarPreview}
                disabled={productos.length === 0}
              >
                <Eye size={20} />
                <span>Vista Previa</span>
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
        </>
      ) : (
        <PdfPreview
          cliente={{ ...cliente, iva: opciones.iva }}
          productos={productos}
          subtotal={calcularSubtotal()}
          descuento={calcularDescuento()}
          descuentoPorcentaje={opciones.descuento}
          iva={calcularIVA()}
          ivaPorcentaje={opciones.iva}
          total={calcularTotal()}
          onBack={() => setShowPreview(false)}
          onDownload={generarPDF}
          onSave={guardarPresupuesto}
        />
      )}
    </div>
  );
};

export default PresupuestoForm;
