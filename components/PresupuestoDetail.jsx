"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

const PresupuestoDetail = ({ presupuesto }) => {
  const [converting, setConverting] = useState(false)
  const [estadoPago, setEstadoPago] = useState("a_pagar")
  const [montoRestante, setMontoRestante] = useState(0)
  const [fechaEntrega, setFechaEntrega] = useState("")
  const [showConvertForm, setShowConvertForm] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()

  // Agregar más logs para depuración
  useEffect(() => {
    if (presupuesto) {
      console.log("PresupuestoDetail - ID del presupuesto cargado:", presupuesto.id)
      console.log("PresupuestoDetail - Datos completos del presupuesto:", presupuesto)
    }
  }, [presupuesto])

  if (!presupuesto) {
    return (
      <div className="presupuesto-detail-container">
        <div className="loading">Presupuesto no encontrado</div>
      </div>
    )
  }

  // Asegurarnos de que estamos usando el ID correcto
  const presupuestoId = presupuesto.id
  console.log("PresupuestoDetail - ID que se usará para operaciones:", presupuestoId)

  // Modifica la función generarPDF para usar importación dinámica
  const generarPDF = async () => {
    // Importamos jsPDF y autoTable dinámicamente
    const { jsPDF } = await import("jspdf")
    const autoTable = (await import("jspdf-autotable")).default

    const doc = new jsPDF()

    // Título
    doc.setFontSize(22)
    doc.text("Casa Luongo - Presupuesto", 105, 20, { align: "center" })

    // Número de presupuesto
    doc.setFontSize(14)
    doc.text(`Presupuesto N°: ${presupuesto.numero}`, 105, 30, { align: "center" })

    // Información del cliente
    doc.setFontSize(12)
    doc.text(`Cliente: ${presupuesto.nombre}`, 20, 40)
    doc.text(`Domicilio: ${presupuesto.domicilio}`, 20, 50)
    doc.text(`Entre calles: ${presupuesto.entre_calles}`, 20, 60)
    doc.text(`Teléfono: ${presupuesto.telefono}`, 20, 70)
    doc.text(`IVA: ${presupuesto.iva_porcentaje}`, 20, 80)

    // Fecha
    const fecha = new Date(presupuesto.fecha_creacion).toLocaleDateString()
    doc.text(`Fecha: ${fecha}`, 150, 40)

    // Tabla de productos
    const tableColumn = ["Cantidad", "Producto", "Precio Unitario", "Subtotal"]
    const tableRows = []

    presupuesto.productos.forEach((producto) => {
      const productData = [
        producto.cantidad,
        producto.nombre,
        `$${Number(producto.precio_unitario).toLocaleString()}`,
        `$${Number(producto.subtotal).toLocaleString()}`,
      ]
      tableRows.push(productData)
    })

    // Usar autoTable como función independiente en lugar de método
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 90,
      theme: "grid",
      styles: { fontSize: 10, halign: "center" },
      headStyles: { fillColor: [255, 102, 0], halign: "center" },
      columnStyles: {
        0: { halign: "center" },
        1: { halign: "center" },
        2: { halign: "center" },
        3: { halign: "center" },
      },
    })

    // Total
    const finalY = doc.lastAutoTable.finalY || 90
    doc.text(`Total: $${Number(presupuesto.total).toLocaleString()}`, 150, finalY + 20)

    // Términos y condiciones
    doc.setFontSize(8)
    doc.text("Este presupuesto tiene una validez de 24 hs.", 20, finalY + 40)
    doc.text("Los precios pueden estar sujetos a modificaciones sin previo aviso.", 20, finalY + 45)
    doc.text(
      "Los cambios y devoluciones se aceptan dentro de las 24/48hs de la recepción de la compra.",
      20,
      finalY + 50,
    )
    doc.text("Los materiales o productos de segunda selección, no tienen cambio, ni devolución.", 20, finalY + 55)

    doc.save(`presupuesto-${presupuesto.numero}.pdf`)
    showToast("PDF generado correctamente", "success")
  }

  const handleConvertirClick = () => {
    setEstadoPago("a_pagar")
    setMontoRestante(0)
    setFechaEntrega("")
    setShowConvertForm(true)
  }

  const handleCancelarConversion = () => {
    setShowConvertForm(false)
  }

  // Modificar la función convertirAPedido para corregir el manejo de fechas
  const convertirAPedido = async () => {
    try {
      setConverting(true)

      // Corregir la fecha de entrega si es necesario
      let fechaEntregaCorregida = fechaEntrega
      if (fechaEntrega) {
        // Crear un objeto Date a partir de la fecha seleccionada
        const fecha = new Date(fechaEntrega)

        // Obtener el año actual
        const añoActual = new Date().getFullYear()

        // Si el año de la fecha es diferente al año actual, corregirlo
        if (fecha.getFullYear() !== añoActual) {
          // Establecer el año correcto
          fecha.setFullYear(añoActual)

          // Formatear la fecha como YYYY-MM-DD
          fechaEntregaCorregida = fecha.toISOString().split("T")[0]
          console.log("Fecha de entrega corregida en convertirAPedido:", fechaEntregaCorregida)
        }
      }

      const data = {
        estado_pago: estadoPago,
        monto_restante: estadoPago === "resta_abonar" ? montoRestante : 0,
        fecha_entrega: fechaEntregaCorregida || null,
      }

      console.log("Enviando datos para convertir presupuesto:", JSON.stringify(data))
      console.log("ID del presupuesto a convertir:", presupuestoId)

      const response = await fetch(`/api/presupuestos/${presupuestoId}/convertir-a-pedido`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al convertir el presupuesto")
      }

      const result = await response.json()
      console.log("Resultado de la conversión:", result)

      showToast("Presupuesto convertido a pedido correctamente", "success")
      router.push(`/pedidos/${result.id}`)
    } catch (error) {
      console.error("Error al convertir presupuesto:", error)
      showToast(`Error al convertir el presupuesto: ${error.message}`, "error")
    } finally {
      setConverting(false)
      setShowConvertForm(false)
    }
  }

  const handleConfirmConversion = () => {
    convertirAPedido()
  }

  return (
    <div className="presupuesto-detail-container">
      <div className="presupuesto-detail-header">
        <h2>Presupuesto #{presupuesto.numero}</h2>
        <div className="presupuesto-detail-actions">
          <button className="btn btn-secondary" onClick={() => router.back()}>
            Volver
          </button>
          <button className="btn btn-descargar" onClick={generarPDF}>
            Descargar PDF
          </button>
          {/* Agregar log para depurar el ID usado en el enlace */}
          <Link
            href={`/presupuestos/${presupuestoId}/editar`}
            className="btn btn-primary"
            onClick={() => console.log("Navegando a editar presupuesto con ID:", presupuestoId)}
          >
            Editar Presupuesto
          </Link>
          <button className="btn btn-primary" onClick={handleConvertirClick}>
            Convertir a Pedido
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
              <button className="btn btn-secondary" onClick={() => setShowConvertForm(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleConfirmConversion} disabled={converting}>
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
              <strong>Nombre:</strong> {presupuesto.nombre}
            </p>
            <p>
              <strong>Domicilio:</strong> {presupuesto.domicilio}
            </p>
            <p>
              <strong>Entre calles:</strong> {presupuesto.entre_calles}
            </p>
            <p>
              <strong>Teléfono:</strong> {presupuesto.telefono}
            </p>
          </div>
        </div>

        <div className="presupuesto-detail-section">
          <h3>Detalles del Presupuesto</h3>
          <div className="presupuesto-detail-meta">
            <p>
              <strong>Fecha:</strong> {new Date(presupuesto.fecha_creacion).toLocaleDateString()}
            </p>
            <p>
              <strong>Estado:</strong> Presupuesto
            </p>
            <p>
              <strong>IVA:</strong> {presupuesto.iva_porcentaje}
            </p>
          </div>
        </div>
      </div>

      <div className="presupuesto-detail-products">
        <h3>Productos</h3>
        <div className="presupuesto-detail-table">
          <div className="presupuesto-detail-table-header">
            <div className="presupuesto-detail-column text-center">Cantidad</div>
            <div className="presupuesto-detail-column product-name text-center">Producto</div>
            <div className="presupuesto-detail-column text-center">Precio Unitario</div>
            <div className="presupuesto-detail-column text-center">Subtotal</div>
          </div>

          {presupuesto.productos.map((producto) => (
            <div key={producto.id} className="presupuesto-detail-table-row">
              <div className="presupuesto-detail-column text-center" data-label="Cantidad">
                {producto.cantidad}
              </div>
              <div className="presupuesto-detail-column product-name text-center" data-label="Producto">
                {producto.nombre}
              </div>
              <div className="presupuesto-detail-column text-center" data-label="Precio Unitario">
                ${Number(producto.precio_unitario).toLocaleString()}
              </div>
              <div className="presupuesto-detail-column text-center" data-label="Subtotal">
                ${Number(producto.subtotal).toLocaleString()}
              </div>
            </div>
          ))}

          <div className="presupuesto-detail-table-footer">
            <div className="presupuesto-detail-total">
              <strong>Total:</strong> ${Number(presupuesto.total).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PresupuestoDetail

