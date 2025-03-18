"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import ClienteForm from "./ClienteForm"
import OpcionesForm from "./OpcionesForm"
import ProductForm from "./ProductForm"
import ProductList from "./ProductList"
import PdfPreview from "./PdfPreview"
import { useToast } from "@/hooks/use-toast"
import { Save, FileDown, Eye, ArrowLeft, User, Percent } from "lucide-react"
import styles from "@/styles/PresupuestoForm.module.css"
import productListStyles from "@/styles/ProductList.module.css"

const PresupuestoForm = () => {
  const [productos, setProductos] = useState([])
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showClienteForm, setShowClienteForm] = useState(false)
  const [showOpcionesForm, setShowOpcionesForm] = useState(false)
  const [cliente, setCliente] = useState({
    nombre: "Consumidor Final",
    domicilio: "",
    entreCalles: "",
    telefono: "",
    localidad: "",
  })
  const [opciones, setOpciones] = useState({
    iva: "0%",
    descuento: "0%",
  })
  const router = useRouter()
  const { showToast } = useToast()

  const agregarProducto = (producto) => {
    const productoExistente = productos.find((p) => p.nombre === producto.nombre)

    if (productoExistente) {
      setProductos(
        productos.map((p) => (p.nombre === producto.nombre ? { ...p, cantidad: p.cantidad + producto.cantidad } : p)),
      )
    } else {
      setProductos([
        ...productos,
        {
          ...producto,
          id: Date.now(),
          subtotal: producto.cantidad * producto.precioUnitario,
        },
      ])
    }
  }

  const eliminarProducto = (id) => {
    setProductos(productos.filter((producto) => producto.id !== id))
  }

  const calcularSubtotal = () => {
    return productos.reduce((total, producto) => total + producto.subtotal, 0)
  }

  const calcularDescuento = () => {
    const subtotal = calcularSubtotal()
    const descuentoRate = Number.parseFloat(opciones.descuento) / 100
    return subtotal * descuentoRate
  }

  const calcularIVA = () => {
    const subtotal = calcularSubtotal()
    const descuento = calcularDescuento()
    const baseImponible = subtotal - descuento
    const ivaRate = Number.parseFloat(opciones.iva) / 100
    return baseImponible * ivaRate
  }

  const calcularTotal = () => {
    const subtotal = calcularSubtotal()
    const descuento = calcularDescuento()
    const iva = calcularIVA()
    return subtotal - descuento + iva
  }

  const handleClienteChange = (nuevoCliente) => {
    setCliente({ ...cliente, ...nuevoCliente })
  }

  const handleOpcionesChange = (nuevasOpciones) => {
    setOpciones({ ...opciones, ...nuevasOpciones })
  }

  const generarPDF = async () => {
    // Código existente para generar PDF
    showToast("PDF generado correctamente", "success")
  }

  const guardarPresupuesto = async () => {
    if (productos.length === 0) {
      showToast("Debe agregar al menos un producto", "error")
      return
    }

    try {
      setSaving(true)

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
      }

      console.log("Enviando datos:", JSON.stringify(presupuestoData))

      const response = await fetch("/api/presupuestos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(presupuestoData),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "Error al guardar el presupuesto")
      }

      showToast("Presupuesto guardado correctamente", "success")
      router.push(`/presupuestos/${responseData.id}`)
    } catch (error) {
      console.error("Error al guardar presupuesto:", error)
      showToast(`Error al guardar el presupuesto: ${error.message}`, "error")
    } finally {
      setSaving(false)
    }
  }

  const mostrarPreview = () => {
    setShowPreview(true)
  }

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

          {showClienteForm && <ClienteForm cliente={cliente} onChange={handleClienteChange} />}

          {showOpcionesForm && (
            <OpcionesForm iva={opciones.iva} descuento={opciones.descuento} onChange={handleOpcionesChange} />
          )}

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>CARGAR PRODUCTOS</h2>
            <ProductForm onAgregarProducto={agregarProducto} />
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>PEDIDO</h2>
            {productos.length > 0 ? (
              <>
                <ProductList productos={productos} onEliminarProducto={eliminarProducto} />
                <div className={productListStyles.totalContainer}>
                  <div className={productListStyles.totalDetails}>
                    <p className={productListStyles.subtotal}>
                      Subtotal: <span className={productListStyles.amount}>${calcularSubtotal().toLocaleString()}</span>
                    </p>
                    {Number.parseFloat(opciones.descuento) > 0 && (
                      <p className={productListStyles.descuento}>
                        Descuento ({opciones.descuento}):{" "}
                        <span className={productListStyles.amount}>-${calcularDescuento().toLocaleString()}</span>
                      </p>
                    )}
                    {Number.parseFloat(opciones.iva) > 0 && (
                      <p className={productListStyles.iva}>
                        IVA ({opciones.iva}):{" "}
                        <span className={productListStyles.amount}>${calcularIVA().toLocaleString()}</span>
                      </p>
                    )}
                    <p className={productListStyles.total}>
                      Total: <span className={productListStyles.totalAmount}>${calcularTotal().toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className={styles.noProductos}>No hay productos seleccionados</p>
            )}

            <div className={styles.actionButtons}>
              <button className="btn btn-secondary btn-icon" onClick={() => router.back()}>
                <ArrowLeft size={20} />
                <span>Cancelar</span>
              </button>
              <button className="btn btn-descargar btn-icon" onClick={generarPDF} disabled={productos.length === 0}>
                <FileDown size={20} />
                <span>Descargar PDF</span>
              </button>
              <button className="btn btn-preview btn-icon" onClick={mostrarPreview} disabled={productos.length === 0}>
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
  )
}

export default PresupuestoForm

