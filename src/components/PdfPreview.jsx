"use client"

const PdfPreview = ({ cliente, productos, total, onBack, onDownload }) => {
  const fecha = new Date().toLocaleDateString()

  return (
    <div className="pdf-preview">
      <div className="pdf-container">
        <div className="pdf-header">
          <h1>Casa Luongo - Presupuesto</h1>
          <p className="pdf-date">Fecha: {fecha}</p>
        </div>

        <div className="pdf-client-info">
          <p>
            <strong>Cliente:</strong> {cliente.nombre}
          </p>
          <p>
            <strong>Domicilio:</strong> {cliente.domicilio}
          </p>
          <p>
            <strong>Entre calles:</strong> {cliente.entreCalles}
          </p>
          <p>
            <strong>Teléfono:</strong> {cliente.telefono}
          </p>
          <p>
            <strong>IVA:</strong> {cliente.iva}
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
        <button className="btn btn-back" onClick={onBack}>
          Volver
        </button>
        <button className="btn btn-descargar" onClick={onDownload}>
          Descargar PDF
        </button>
      </div>
    </div>
  )
}

export default PdfPreview

