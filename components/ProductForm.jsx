"use client";

import { useState } from "react";
import styles from "@/styles/ProductForm.module.css";

const ProductForm = ({ onAgregarProducto }) => {
  const [producto, setProducto] = useState({
    cantidad: "",
    nombre: "",
    precioUnitario: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProducto({
      ...producto,
      [name]:
        name === "cantidad" || name === "precioUnitario"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!producto.cantidad || !producto.nombre || !producto.precioUnitario) {
      alert("Por favor complete todos los campos");
      return;
    }

    onAgregarProducto({
      ...producto,
      subtotal: producto.cantidad * producto.precioUnitario,
    });

    // Limpiar el formulario
    setProducto({
      cantidad: "",
      nombre: "",
      precioUnitario: "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.productForm}>
      <div className={styles.inputsRow}>
        <div className={styles.inputColumn}>
          <label htmlFor="cantidad">Cantidad</label>
          <input
            type="number"
            id="cantidad"
            name="cantidad"
            value={producto.cantidad}
            onChange={handleChange}
            min="1"
          />
        </div>

        <div className={`${styles.inputColumn} ${styles.productColumn}`}>
          <label htmlFor="nombre">Producto</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={producto.nombre}
            onChange={handleChange}
          />
        </div>

        <div className={styles.inputColumn}>
          <label htmlFor="precioUnitario">Precio Unitario</label>
          <input
            type="number"
            id="precioUnitario"
            name="precioUnitario"
            value={producto.precioUnitario}
            onChange={handleChange}
            min="0"
          />
        </div>

        {/* Modificar la estructura del botón para asegurar un mejor centrado */}
        <div className={styles.buttonColumn}>
          <label>Agregar</label>
          <button
            type="submit"
            className={styles.addButton}
            aria-label="Agregar producto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.iconAdd}
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
};

export default ProductForm;
