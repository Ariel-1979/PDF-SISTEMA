"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
  Eye,
  Trash2,
  Edit,
  Search,
  FileText,
  MoreVertical,
  FileEdit,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import DatePickerWithHighlight from "./DatePickerShadcn";

// Importar el CSS Module
import styles from "@/styles/pedidos.module.css";

const PedidosList = () => {
  const [pedidos, setPedidos] = useState([]);
  const [filteredPedidos, setFilteredPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [estadoEntregaFilter, setEstadoEntregaFilter] = useState("todos");
  const [estadoPagoFilter, setEstadoPagoFilter] = useState("todos");
  const [fechaFilter, setFechaFilter] = useState("");
  const [fechasConPedidos, setFechasConPedidos] = useState([]);
  const [filtersActive, setFiltersActive] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchPedidos();
  }, []);

  useEffect(() => {
    // Aplicar filtros cuando cambian los pedidos o los filtros
    applyFilters();

    // Verificar si hay filtros activos
    setFiltersActive(
      estadoEntregaFilter !== "todos" ||
        estadoPagoFilter !== "todos" ||
        fechaFilter !== ""
    );
  }, [
    pedidos,
    estadoEntregaFilter,
    estadoPagoFilter,
    searchQuery,
    fechaFilter,
  ]);

  // Extraer las fechas únicas con pedidos
  useEffect(() => {
    if (pedidos.length > 0) {
      const fechas = pedidos
        .filter((pedido) => pedido.fecha_entrega)
        .map((pedido) => pedido.fecha_entrega.split("T")[0]);

      // Eliminar duplicados
      const fechasUnicas = [...new Set(fechas)];
      setFechasConPedidos(fechasUnicas);
    }
  }, [pedidos]);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/pedidos");

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al cargar pedidos");
      }

      const data = await res.json();
      const pedidosData = Array.isArray(data) ? data : [];

      setPedidos(pedidosData);
      setFilteredPedidos(pedidosData);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
      showToast("Error al cargar pedidos: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...pedidos];

    // Filtrar por estado de entrega
    if (estadoEntregaFilter !== "todos") {
      result = result.filter(
        (pedido) => pedido.estado_entrega === estadoEntregaFilter
      );
    }

    // Filtrar por estado de pago
    if (estadoPagoFilter !== "todos") {
      result = result.filter(
        (pedido) => pedido.estado_pago === estadoPagoFilter
      );
    }

    // Filtrar por fecha de entrega
    if (fechaFilter) {
      result = result.filter((pedido) => {
        if (!pedido.fecha_entrega) return false;
        return pedido.fecha_entrega.split("T")[0] === fechaFilter;
      });
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (pedido) =>
          (pedido.numero && pedido.numero.toLowerCase().includes(query)) ||
          (pedido.cliente_nombre &&
            pedido.cliente_nombre.toLowerCase().includes(query)) ||
          (pedido.domicilio && pedido.domicilio.toLowerCase().includes(query))
      );
    }

    setFilteredPedidos(result);
  };

  const resetFilters = () => {
    setEstadoEntregaFilter("todos");
    setEstadoPagoFilter("todos");
    setFechaFilter("");
    // No reseteamos la búsqueda, solo los filtros
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      // Si la búsqueda está vacía, aplicar solo los filtros actuales
      applyFilters();
      return;
    }

    try {
      setSearching(true);
      setLoading(true);

      console.log("Buscando pedidos con término:", searchQuery.trim());
      const res = await fetch(
        `/api/pedidos?query=${encodeURIComponent(searchQuery.trim())}`
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al buscar pedidos");
      }

      const data = await res.json();
      console.log("Resultados de búsqueda:", data);
      setPedidos(Array.isArray(data) ? data : []);
      // Los filtros se aplicarán automáticamente en el useEffect
    } catch (error) {
      console.error("Error al buscar pedidos:", error);
      showToast("Error al buscar pedidos: " + error.message, "error");
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const handleEliminarPedido = (id) => {
    toast.custom(
      (t) => (
        <div className="sonner-toast-custom">
          <p className="confirmation-title">
            ¿Está seguro de eliminar este pedido?
          </p>
          <p className="confirmation-subtitle">
            Esta acción no se puede deshacer.
          </p>
          <div className="toast-actions">
            <button
              className="btn btn-small btn-danger"
              onClick={() => {
                toast.dismiss(t);
                confirmarEliminarPedido(id);
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

  const confirmarEliminarPedido = async (id) => {
    try {
      const res = await fetch(`/api/pedidos/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al eliminar el pedido");
      }

      showToast("Pedido eliminado correctamente", "success");
      fetchPedidos();
    } catch (error) {
      console.error("Error al eliminar pedido:", error);
      showToast("Error al eliminar el pedido: " + error.message, "error");
    }
  };

  const getEstadoEntregaLabel = (estado) => {
    switch (estado) {
      case "pendiente":
        return (
          <span className="badge badge-warning badge-rounded">Pendiente</span>
        );
      case "entregado":
        return (
          <span className="badge badge-success badge-rounded">Entregado</span>
        );
      default:
        return (
          <span className="badge badge-secondary badge-rounded">
            Desconocido
          </span>
        );
    }
  };

  const getEstadoPagoLabel = (estado) => {
    switch (estado) {
      case "abonado":
        return (
          <span className="badge badge-success badge-rounded">Abonado</span>
        );
      case "a_pagar":
        return (
          <span className="badge badge-warning badge-rounded">A Pagar</span>
        );
      case "resta_abonar":
        return (
          <span className="badge badge-info badge-rounded">Resta Abonar</span>
        );
      default:
        return (
          <span className="badge badge-secondary badge-rounded">
            Desconocido
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No especificada";

    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading && !searching) {
    return (
      <div className="presupuestos-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="presupuestos-container">
      <div className="presupuestos-header">
        <h2>Pedidos</h2>
      </div>

      {/* Contenedor de filtros alineados horizontalmente */}
      <div className={styles.filtersContainer}>
        {/* Buscador */}
        <div className={styles.searchContainer}>
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="btn-search" disabled={searching}>
                <Search size={20} />
              </button>
            </div>
          </form>
        </div>

        {/* Grupo de filtros */}
        <div className={styles.filtersGroup}>
          {/* Filtro de estado de entrega */}
          <select
            id="estadoEntrega"
            className={styles.filterSelect}
            value={estadoEntregaFilter}
            onChange={(e) => setEstadoEntregaFilter(e.target.value)}
            aria-label="Filtrar por estado de entrega"
          >
            <option value="todos">Estado: Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="entregado">Entregado</option>
          </select>

          {/* Filtro de estado de pago */}
          <select
            id="estadoPago"
            className={styles.filterSelect}
            value={estadoPagoFilter}
            onChange={(e) => setEstadoPagoFilter(e.target.value)}
            aria-label="Filtrar por estado de pago"
          >
            <option value="todos">Pago: Todos</option>
            <option value="abonado">Abonado</option>
            <option value="a_pagar">A Pagar</option>
            <option value="resta_abonar">Resta Abonar</option>
          </select>

          {/* Nuevo filtro de fecha con calendario personalizado */}
          <DatePickerWithHighlight
            value={fechaFilter}
            onChange={setFechaFilter}
            datesWithPedidos={fechasConPedidos}
          />

          {/* Botón para limpiar filtros */}
          {filtersActive && (
            <button
              className={styles.clearFiltersButton}
              onClick={resetFilters}
              title="Borrar filtros"
            >
              <Trash2 size={18} color="var(--danger-color)" />
            </button>
          )}
        </div>
      </div>

      {filteredPedidos.length > 0 ? (
        <div className="presupuestos-table-container">
          <table className={styles.pedidosTable}>
            <thead>
              <tr>
                <th className={styles.columnNumero}>Número</th>
                <th className={styles.columnFecha}>Fecha Entrega</th>
                <th className={styles.columnCliente}>Cliente</th>
                <th className={styles.columnDomicilio}>Domicilio</th>
                <th className={styles.columnTotal}>Total</th>
                <th className={styles.columnEstado}>Estado</th>
                <th className={styles.columnAcciones}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPedidos.map((pedido) => (
                <tr key={pedido.id} className="presupuesto-row">
                  <td className={styles.columnNumero} data-label="Número">
                    <div className="numero-container">
                      <FileText size={16} className="icon-inline" />{" "}
                      {pedido.numero}
                    </div>
                  </td>
                  <td className={styles.columnFecha} data-label="Fecha Entrega">
                    {formatDate(pedido.fecha_entrega)}
                  </td>
                  <td className={styles.columnCliente} data-label="Cliente">
                    {pedido.cliente_nombre}
                  </td>
                  <td className={styles.columnDomicilio} data-label="Domicilio">
                    {pedido.domicilio || "No especificado"}
                  </td>
                  <td className={styles.columnTotal} data-label="Total">
                    ${Number(pedido.total).toLocaleString()}
                  </td>
                  <td className={styles.columnEstado} data-label="Estado">
                    {getEstadoEntregaLabel(pedido.estado_entrega)}
                    {/* Mostrar estado de pago solo si no está entregado */}
                    {pedido.estado_entrega !== "entregado" &&
                      getEstadoPagoLabel(pedido.estado_pago)}
                  </td>
                  <td className={styles.columnAcciones} data-label="Acciones">
                    <div className={styles.accionesContainer}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className={styles.dropdownTrigger}>
                            <MoreVertical size={18} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="dropdown-menu-content"
                        >
                          <DropdownMenuItem className={styles.dropdownItem}>
                            <Link
                              href={`/pedidos/${pedido.id}`}
                              className={styles.dropdownLink}
                            >
                              <Eye size={16} className={styles.dropdownIcon} />
                              <span>Ver Pedido</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className={styles.dropdownItem}>
                            <Link
                              href={`/pedidos/${pedido.id}/editar`}
                              className={styles.dropdownLink}
                            >
                              <Edit size={16} className={styles.dropdownIcon} />
                              <span>Editar Pedido</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className={styles.dropdownItem}>
                            <Link
                              href={`/pedidos/${pedido.id}`}
                              className={styles.dropdownLink}
                            >
                              <FileEdit
                                size={16}
                                className={styles.dropdownIcon}
                              />
                              <span>Editar Estado</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                            onClick={() => handleEliminarPedido(pedido.id)}
                          >
                            <div className={styles.dropdownLink}>
                              <Trash2
                                size={16}
                                className={styles.dropdownIcon}
                              />
                              <span>Eliminar</span>
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
              {searchQuery ||
              estadoEntregaFilter !== "todos" ||
              estadoPagoFilter !== "todos" ||
              fechaFilter
                ? "No se encontraron pedidos con los filtros aplicados"
                : "No hay pedidos disponibles"}
            </p>
            {(searchQuery ||
              estadoEntregaFilter !== "todos" ||
              estadoPagoFilter !== "todos" ||
              fechaFilter) && (
              <button
                className="btn-secondary"
                onClick={() => {
                  setSearchQuery("");
                  setEstadoEntregaFilter("todos");
                  setEstadoPagoFilter("todos");
                  setFechaFilter("");
                  fetchPedidos();
                }}
              >
                Ver todos los pedidos
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PedidosList;
