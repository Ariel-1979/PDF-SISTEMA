"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ClienteForm from "./ClienteForm";
import OpcionesForm from "./OpcionesForm";
import ProductForm from "./ProductForm";
import ProductList from "./ProductList";
import { useToast } from "@/hooks/use-toast";
import { Save, ArrowLeft, User, Percent } from "lucide-react";

const PedidoEditForm = ({ pedido }) => {
  const [productos, setProductos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showClienteForm, setShowClienteForm] = useState(false);
  const [showOpcionesForm, setShowOpcionesForm] = useState(false);
  const [cliente, setCliente] = useState({
    nombre: "",
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

  useEffect(() => {
    if (pedido) {
      setCliente({
        nombre: pedido.nombre || "Consumidor Final",
        domicilio: pedido.domicilio || "",
        entreCalles: pedido.entre_calles || "",
        telefono: pedido.telefono || "",
        localidad: pedido.localidad || "",
      });

      setOpciones({
        iva: pedido.iva_porcentaje || "0%",
        descuento: pedido.descuento_porcentaje || "0%",
      });

      if (Array.isArray(pedido.productos)) {
        setProductos(
          pedido.productos.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            cantidad: p.cantidad,
            precioUnitario: Number(p.precio_unitario),
            subtotal: Number(p.subtotal),
          }))
        );
      }
    }
  }, [pedido]);

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

  const guardarPedido = async () => {
    if (productos.length === 0) {
      showToast("Debe agregar al menos un producto", "error");
      return;
    }

    try {
      setSaving(true);

      const pedidoData = {
        cliente: {
          nombre: cliente.nombre,
          domicilio: cliente.domicilio,
          entreCalles: cliente.entreCalles,
          telefono: cliente.telefono,
          localidad: cliente.localidad,
        },
        productos,
        subtotal: calcularSubtotal(),
        descuento_porcentaje: opciones.descuento,
        descuento_monto: calcularDescuento(),
        iva_monto: calcularIVA(),
        total: calcularTotal(),
        iva_porcentaje: opciones.iva,
      };

      console.log("Enviando datos:", JSON.stringify(pedidoData));
      console.log("ID del pedido para actualizar:", pedido.id);

      const response = await fetch(`/api/pedidos/${pedido.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pedidoData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar el pedido");
      }

      showToast("Pedido actualizado correctamente", "success");
      router.push(`/pedidos/${pedido.id}`);
    } catch (error) {
      console.error("Error al actualizar pedido:", error);
      showToast(`Error al actualizar el pedido: ${error.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  if (!pedido) {
    return (
      <div className="pedido-container">
        <div className="loading">Pedido no encontrado</div>
      </div>
    );
  }

  return (
    <div className="presupuesto-container">
      <div className="presupuesto-header">
        <h2>Editar Pedido #{pedido.numero}</h2>
        <div className="header-actions">
          <button
            className="btn btn-icon-only btn-client"
            onClick={() => setShowClienteForm(!showClienteForm)}
            title="Datos del cliente"
          >
            <User size={20} />
          </button>
          <button
            className="btn btn-icon-only btn-options"
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

      <section className="section">
        <h2 className="section-title">CARGAR PRODUCTOS</h2>
        <ProductForm onAgregarProducto={agregarProducto} />
      </section>

      <section className="section">
        <h2 className="section-title">PEDIDO</h2>
        {productos.length > 0 ? (
          <>
            <ProductList
              productos={productos}
              onEliminarProducto={eliminarProducto}
            />
            <div className="total-container">
              <div className="total-details">
                <p className="subtotal">
                  Subtotal:{" "}
                  <span className="amount">
                    ${calcularSubtotal().toLocaleString()}
                  </span>
                </p>
                {Number.parseFloat(opciones.descuento) > 0 && (
                  <p className="descuento">
                    Descuento ({opciones.descuento}):{" "}
                    <span className="amount">
                      -${calcularDescuento().toLocaleString()}
                    </span>
                  </p>
                )}
                {Number.parseFloat(opciones.iva) > 0 && (
                  <p className="iva">
                    IVA ({opciones.iva}):{" "}
                    <span className="amount">
                      ${calcularIVA().toLocaleString()}
                    </span>
                  </p>
                )}
                <p className="total">
                  Total:{" "}
                  <span className="total-amount">
                    ${calcularTotal().toLocaleString()}
                  </span>
                </p>
              </div>
            </div>
          </>
        ) : (
          <p className="no-productos">No hay productos seleccionados</p>
        )}

        <div className="action-buttons-centered">
          <button
            className="btn btn-secondary btn-icon"
            onClick={() => router.back()}
          >
            <ArrowLeft size={20} />
            <span>Cancelar</span>
          </button>
          <button
            className="btn btn-primary btn-icon"
            onClick={guardarPedido}
            disabled={productos.length === 0 || saving}
          >
            <Save size={20} />
            <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default PedidoEditForm;
