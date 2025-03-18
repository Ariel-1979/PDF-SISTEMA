"use client"

import { Trash2 } from "lucide-react"
import styles from "@/styles/ProductList.module.css"

const ProductList = ({ productos, onEliminarProducto }) => {
  return (
    <div className={styles.productList}>
      <div className={styles.listHeader}>
        <div className={styles.column}>Cantidad</div>
        <div className={`${styles.column} ${styles.productNameColumn}`}>Producto</div>
        <div className={styles.column}>Precio x Unidad</div>
        <div className={styles.column}>Subtotal</div>
        <div className={styles.column}>Eliminar</div>
      </div>

      {productos.map((producto) => (
        <div key={producto.id} className={styles.productItem}>
          <div className={styles.column} data-label="Cantidad">
            {producto.cantidad}
          </div>
          <div className={`${styles.column} ${styles.productNameColumn}`} data-label="Producto">
            {producto.nombre}
          </div>
          <div className={styles.column} data-label="Precio x Unidad">
            ${producto.precioUnitario.toLocaleString()}
          </div>
          <div className={styles.column} data-label="Subtotal">
            ${producto.subtotal.toLocaleString()}
          </div>
          <div className={styles.column}>
            <button className={styles.trashButton} onClick={() => onEliminarProducto(producto.id)}>
              <Trash2 size={20} className={styles.iconTrash} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ProductList

