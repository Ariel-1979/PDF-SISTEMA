"use client"

const ProductList = ({ productos, onEliminarProducto }) => {
  return (
    <div className="product-list">
      <div className="product-list-header">
        <div className="product-column">Cantidad</div>
        <div className="product-column product-name">Producto</div>
        <div className="product-column">Precio x Unidad</div>
        <div className="product-column">Subtotal</div>
        <div className="product-column">Eliminar</div>
      </div>

      {productos.map((producto) => (
        <div key={producto.id} className="product-item">
          <div className="product-column">{producto.cantidad}</div>
          <div className="product-column product-name">{producto.nombre}</div>
          <div className="product-column">{producto.precioUnitario.toLocaleString()}</div>
          <div className="product-column">{producto.subtotal.toLocaleString()}</div>
          <div className="product-column">
            <button className="btn-delete" onClick={() => onEliminarProducto(producto.id)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="icon-delete"
              >
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ProductList

