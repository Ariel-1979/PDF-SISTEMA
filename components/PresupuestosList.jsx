"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Eye, Trash2, RefreshCw, Search, FileText, Plus } from "lucide-react";
import { toast } from "sonner";

const PresupuestosList = () => {
  const [presupuestos, setPresupuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [selectedPresupuestoId, setSelectedPresupuestoId] = useState(null);
  const [estadoPago, setEstadoPago] = useState("a_pagar");
  const [montoRestante, setMontoRestante] = useState(0);
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [converting, setConverting] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    fetchPresupuestos();
  }, []);

  const fetchPresupuestos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/presupuestos");

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al cargar presupuestos");
      }

      const data = await res.json();

      setPresupuestos(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast("Error al cargar presupuestos: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      fetchPresupuestos();
      return;
    }

    try {
      setSearching(true);
      setLoading(true);

      const res = await fetch(
        `/api/presupuestos?query=${encodeURIComponent(searchQuery.trim())}`
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al buscar presupuestos");
      }

      const data = await res.json();
      setPresupuestos(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast("Error al buscar presupuestos: " + error.message, "error");
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const handleNuevoPresupuesto = () => {
    router.push("/presupuestos/nuevo");
  };

  const handleEliminarPresupuesto = (id) => {
    toast.custom(
      (t) => (
        <div className="sonner-toast-custom">
          <p className="confirmation-title">
            ¿Está seguro de eliminar este presupuesto?
          </p>
          <p className="confirmation-subtitle">
            Esta acción no se puede deshacer.
          </p>
          <div className="toast-actions">
            <button
              className="btn btn-small btn-danger"
              onClick={() => {
                toast.dismiss(t);
                confirmarEliminarPresupuesto(id);
              }}
            >
              Eliminar
            </button>
            <button
              className="btn btn-small btn-secondary"
              onClick={() => toast.dismiss(t)}
            >
              Cancelar
            </button>
          </div>
        </div>
      ),
      { duration: 10000 }
    );
  };

  const confirmarEliminarPresupuesto = async (id) => {
    try {
      const res = await fetch(`/api/presupuestos/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al eliminar el presupuesto");
      }

      showToast("Presupuesto eliminado correctamente", "success");
      fetchPresupuestos();
    } catch (error) {
      console.error("Error al eliminar presupuesto:", error);
      showToast("Error al eliminar el presupuesto: " + error.message, "error");
    }
  };

  const handleConvertirAPedido = (id) => {
    setSelectedPresupuestoId(id);
    setEstadoPago("a_pagar");
    setMontoRestante(0);
    setFechaEntrega("");
    setShowConvertForm(true);
  };

  const handleCancelarConversion = () => {
    setShowConvertForm(false);
    setSelectedPresupuestoId(null);
  };

  const handleConfirmarConversion = async () => {
    if (!selectedPresupuestoId) return;

    try {
      setConverting(true);

      let fechaEntregaCorregida = fechaEntrega;
      if (fechaEntrega) {
        const fecha = new Date(fechaEntrega);

        const añoActual = new Date().getFullYear();

        if (fecha.getFullYear() !== añoActual) {
          fecha.setFullYear(añoActual);

          fechaEntregaCorregida = fecha.toISOString().split("T")[0];
        }
      }

      const data = {
        estado_pago: estadoPago,
        monto_restante: estadoPago === "resta_abonar" ? montoRestante : 0,
        fecha_entrega: fechaEntregaCorregida || null,
      };

      const res = await fetch(
        `/api/presupuestos/${selectedPresupuestoId}/convertir-a-pedido`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al convertir el presupuesto");
      }

      const result = await res.json();
      showToast("Presupuesto convertido a pedido correctamente", "success");
      setShowConvertForm(false);
      fetchPresupuestos();
      router.push(`/pedidos/${result.id}`);
    } catch (error) {
      console.error("Error al convertir presupuesto:", error);
      showToast(`Error al convertir el presupuesto: ${error.message}`, "error");
    } finally {
      setConverting(false);
    }
  };

  if (loading && !searching) {
    return (
      <div className="presupuestos-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando presupuestos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="presupuestos-container">
      <div className="presupuestos-header">
        <h2>Presupuestos</h2>
      </div>

      <div className="search-actions-container">
        <div className="search-container">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Buscar por número, cliente o dirección..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="btn-search" disabled={searching}>
                <Search size={20} />
              </button>
            </div>
            {searchQuery && (
              <button
                type="button"
                className="btn-clear"
                onClick={() => {
                  setSearchQuery("");
                  fetchPresupuestos();
                }}
              >
                Limpiar
              </button>
            )}
          </form>
        </div>
        <button
          className="btn-nuevo-presupuesto"
          onClick={handleNuevoPresupuesto}
        >
          <Plus size={20} />
          <span>Nuevo Presupuesto</span>
        </button>
      </div>

      {presupuestos.length > 0 ? (
        <div className="presupuestos-table-container">
          <table className="presupuestos-table">
            <thead>
              <tr>
                <th className="column-numero">Número</th>
                <th className="column-fecha">Fecha</th>
                <th className="column-cliente">Cliente</th>
                <th className="column-domicilio">Domicilio</th>
                <th className="column-total">Total</th>
                <th className="column-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {presupuestos.map((presupuesto) => (
                <tr key={presupuesto.id} className="presupuesto-row">
                  <td className="column-numero">
                    <div className="numero-container">
                      <FileText size={16} className="icon-inline" />
                      <span>{presupuesto.numero}</span>
                    </div>
                  </td>
                  <td className="column-fecha" data-label="Fecha">
                    {new Date(presupuesto.fecha_creacion).toLocaleDateString()}
                  </td>
                  <td className="column-cliente" data-label="Cliente">
                    {presupuesto.cliente_nombre}
                  </td>
                  <td className="column-domicilio" data-label="Domicilio">
                    {presupuesto.domicilio || "No especificado"}
                  </td>
                  <td className="column-total" data-label="Total">
                    $ {Number(presupuesto.total).toLocaleString()}
                  </td>
                  <td className="column-acciones">
                    <div className="acciones-container">
                      <button
                        className="btn-accion btn-eliminar"
                        onClick={() =>
                          handleEliminarPresupuesto(presupuesto.id)
                        }
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                      <Link
                        href={`/presupuestos/${presupuesto.id}`}
                        className="btn-accion btn-ver"
                        title="Ver"
                      >
                        <Eye size={18} />
                      </Link>
                      <button
                        className="btn-accion btn-convertir"
                        onClick={() => handleConvertirAPedido(presupuesto.id)}
                        title="Convertir a Pedido"
                      >
                        <RefreshCw size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-data-container">
          <div className="no-data-content">
            <FileText size={48} className="no-data-icon" />
            <p className="no-data-message">
              {searchQuery
                ? `No se encontraron presupuestos para "${searchQuery}"`
                : "No hay presupuestos disponibles"}
            </p>
            {searchQuery && (
              <button
                className="btn-secondary"
                onClick={() => {
                  setSearchQuery("");
                  fetchPresupuestos();
                }}
              >
                Ver todos los presupuestos
              </button>
            )}
          </div>
        </div>
      )}

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
              <button
                className="btn-secondary"
                onClick={handleCancelarConversion}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={handleConfirmarConversion}
                disabled={converting}
              >
                {converting ? "Convirtiendo..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresupuestosList;
