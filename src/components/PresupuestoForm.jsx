"use client"

import { useState } from "react"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import ClienteForm from "./ClienteForm"
import ProductForm from "./ProductForm"
import ProductList from "./ProductList"
import PdfPreview from "./PdfPreview"

const PresupuestoForm = () => {
  const [productos, setProductos] = useState([])
  const [showPreview, setShowPreview] = useState(false)
  const [cliente, setCliente] = useState({
    nombre: "Consumidor Final",
    domicilio: "",
    entreCalles: "",
    telefono: "",
    iva: "0%",
  })

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

  const calcularTotal = () => {
    return productos.reduce((total, producto) => total + producto.subtotal, 0)
  }

  const handleClienteChange = (nuevoCliente) => {
    setCliente(nuevoCliente)
  }

  const generarPDF = () => {
    const doc = new jsPDF()

    // Título
    doc.setFontSize(22)
    doc.text("Casa Luongo - Presupuesto", 105, 20, { align: "center" })

    // Información del cliente
    doc.setFontSize(12)
    doc.text(`Cliente: ${cliente.nombre}`, 20, 40)
    doc.text(`Domicilio: ${cliente.domicilio}`, 20, 50)
    doc.text(`Entre calles: ${cliente.entreCalles}`, 20, 60)
    doc.text(`Teléfono: ${cliente.telefono}`, 20, 70)
    doc.text(`IVA: ${cliente.iva}`, 20, 80)

    // Fecha
    const fecha = new Date().toLocaleDateString()
    doc.text(`Fecha: ${fecha}`, 150, 40)

    // Tabla de productos
    const tableColumn = ["Cantidad", "Producto", "Precio Unitario", "Subtotal"]
    const tableRows = []

    productos.forEach((producto) => {
      const productData = [
        producto.cantidad,
        producto.nombre,
        `$${producto.precioUnitario.toLocaleString()}`,
        `$${producto.subtotal.toLocaleString()}`,
      ]
      tableRows.push(productData)
    })

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 90,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [255, 102, 0] },
    })

    // Total
    const finalY = doc.lastAutoTable.finalY || 90
    doc.text(`Total: $${calcularTotal().toLocaleString()}`, 150, finalY + 20)

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

    doc.save("presupuesto-casa-luongo.pdf")
  }

  const mostrarPreview = () => {
    setShowPreview(true)
  }

  return (
    <div className="presupuesto-container">
      {!showPreview ? (
        <>
          <ClienteForm cliente={cliente} onChange={handleClienteChange} />

          <section className="section">
            <h2 className="section-title">CARGAR PRODUCTOS</h2>
            <ProductForm onAgregarProducto={agregarProducto} />
          </section>

          <section className="section">
            <h2 className="section-title">PEDIDO</h2>
            {productos.length > 0 ? (
              <>
                <ProductList productos={productos} onEliminarProducto={eliminarProducto} />
                <div className="total-container">
                  <p className="total">
                    Total: <span className="total-amount">${calcularTotal().toLocaleString()}</span>
                  </p>
                </div>
              </>
            ) : (
              <p className="no-productos">No hay productos seleccionados</p>
            )}

            <div className="buttons-container">
              <button className="btn btn-descargar" onClick={generarPDF} disabled={productos.length === 0}>
                Descargar PDF
              </button>
              <button className="btn btn-nuevo" onClick={mostrarPreview} disabled={productos.length === 0}>
                Nuevo PDF
              </button>
            </div>
          </section>
        </>
      ) : (
        <PdfPreview
          cliente={cliente}
          productos={productos}
          total={calcularTotal()}
          onBack={() => setShowPreview(false)}
          onDownload={generarPDF}
        />
      )}
    </div>
  )
}

export default PresupuestoForm

