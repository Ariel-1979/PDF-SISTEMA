"use client"

import { ArrowLeft, FileDown, Save } from "lucide-react"

const PdfPreview = ({
  cliente,
  productos,
  subtotal,
  descuento,
  descuentoPorcentaje,
  iva,
  ivaPorcentaje,
  total,
  onBack,
  onDownload,
  onSave,
}) => {
  const fecha = new Date().toLocaleDateString()

  return (
    <div className="pdf-preview">
      <div className="pdf-container">
        <div className="pdf-header">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo_Luongo-2yJWkbBhykRbk43ImjzWGhnPvuw3uR.png"
            alt="Casa Luongo Logo"
            className="pdf-logo"
          />
          <h1>Presupuesto</h1>
          <h2>Materiales para la Construcción</h2>
          <p className="pdf-date">Fecha: {fecha}</p>
          <p className="pdf-number">Presupuesto N°: {Date.now().toString().slice(-8)}</p>
        </div>

        <div className="pdf-client-info">
          <p>
            <strong>Cliente:</strong> {cliente.nombre}
          </p>
          <p>
            <strong>Domicilio:</strong> {cliente.domicilio}
          </p>
          {cliente.localidad && (
            <p>
              <strong>Localidad:</strong> {cliente.localidad}
            </p>
          )}
          <p>
            <strong>Entre calles:</strong> {cliente.entreCalles}
          </p>
          <p>
            <strong>Teléfono:</strong> {cliente.telefono}
          </p>
          <p>
            <strong>IVA:</strong> {ivaPorcentaje}
          </p>
        </div>

        <div className="pdf-products">
          <table className="pdf-table">
            <thead>
              <tr>
                <th>Cantidad</th>
                <th>Producto</th>
                <th>Precio Unitario</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((producto) => (
                <tr key={producto.id}>
                  <td>{producto.cantidad}</td>
                  <td>{producto.nombre}</td>
                  <td>${producto.precioUnitario.toLocaleString()}</td>
                  <td>${producto.subtotal.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pdf-total">
          <p>
            <strong>Subtotal:</strong> ${subtotal.toLocaleString()}
          </p>
          {Number.parseFloat(descuentoPorcentaje) > 0 && (
            <p>
              <strong>Descuento ({descuentoPorcentaje}):</strong> -${descuento.toLocaleString()}
            </p>
          )}
          {Number.parseFloat(ivaPorcentaje) > 0 && (
            <p>
              <strong>IVA ({ivaPorcentaje}):</strong> ${iva.toLocaleString()}
            </p>
          )}
          <p className="pdf-total-final">
            <strong>Total:</strong> ${total.toLocaleString()}
          </p>
        </div>

        <div className="pdf-terms">
          <p>Este presupuesto tiene una validez de 24 hs.</p>
          <p>Los precios pueden estar sujetos a modificaciones sin previo aviso.</p>
          <p>Los cambios y devoluciones se aceptan dentro de las 24/48hs de la recepción de la compra.</p>
          <p>Los materiales o productos de segunda selección, no tienen cambio, ni devolución.</p>
        </div>
      </div>

      <div className="pdf-actions">
        <button className="btn btn-back btn-icon" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Volver</span>
        </button>
        <button className="btn btn-descargar btn-icon" onClick={onDownload}>
          <FileDown size={20} />
          <span>Descargar PDF</span>
        </button>
        <button className="btn btn-primary btn-icon" onClick={onSave}>
          <Save size={20} />
          <span>Guardar Presupuesto</span>
        </button>
      </div>
    </div>
  )
}

export default PdfPreview

