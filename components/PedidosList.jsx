"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Eye, Trash2, Edit, Search, FileText, MoreVertical, FileEdit } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

const PedidosList = () => {
  const [pedidos, setPedidos] = useState([])
  const [filteredPedidos, setFilteredPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [estadoEntregaFilter, setEstadoEntregaFilter] = useState("pendiente") // Filtro inicial: pendiente
  const [estadoPagoFilter, setEstadoPagoFilter] = useState("todos")
  const [filtersActive, setFiltersActive] = useState(true) // Para controlar si hay filtros activos
  const { showToast } = useToast()

  useEffect(() => {
    fetchPedidos()
  }, [])

  useEffect(() => {
    // Aplicar filtros cuando cambian los pedidos o los filtros
    applyFilters()

    // Verificar si hay filtros activos
    setFiltersActive(estadoEntregaFilter !== "todos" || estadoPagoFilter !== "todos")
  }, [pedidos, estadoEntregaFilter, estadoPagoFilter, searchQuery])

  const fetchPedidos = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/pedidos")

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Error al cargar pedidos")
      }

      const data = await res.json()
      const pedidosData = Array.isArray(data) ? data : []

      // Verificar los datos recibidos para el campo domicilio
      console.log("Datos de pedidos recibidos:", pedidosData.slice(0, 2))

      setPedidos(pedidosData)

      // Aplicar filtro inicial de pendientes
      setFilteredPedidos(pedidosData.filter((pedido) => pedido.estado_entrega === "pendiente"))
    } catch (error) {
      console.error("Error al cargar pedidos:", error)
      showToast("Error al cargar pedidos: " + error.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let result = [...pedidos]

    // Filtrar por estado de entrega
    if (estadoEntregaFilter !== "todos") {
      result = result.filter((pedido) => pedido.estado_entrega === estadoEntregaFilter)
    }

    // Filtrar por estado de pago
    if (estadoPagoFilter !== "todos") {
      result = result.filter((pedido) => pedido.estado_pago === estadoPagoFilter)
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(
        (pedido) =>
          (pedido.numero && pedido.numero.toLowerCase().includes(query)) ||
          (pedido.cliente_nombre && pedido.cliente_nombre.toLowerCase().includes(query)) ||
          (pedido.domicilio && pedido.domicilio.toLowerCase().includes(query)),
      )
    }

    setFilteredPedidos(result)
  }

  const resetFilters = () => {
    setEstadoEntregaFilter("todos")
    setEstadoPagoFilter("todos")
    // No reseteamos la búsqueda, solo los filtros de estado
  }

  const handleSearch = async (e) => {
    e.preventDefault()

    if (!searchQuery.trim()) {
      // Si la búsqueda está vacía, aplicar solo los filtros actuales
      applyFilters()
      return
    }

    try {
      setSearching(true)
      setLoading(true)

      console.log("Buscando pedidos con término:", searchQuery.trim())
      const res = await fetch(`/api/pedidos?query=${encodeURIComponent(searchQuery.trim())}`)

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Error al buscar pedidos")
      }

      const data = await res.json()
      console.log("Resultados de búsqueda:", data)
      setPedidos(Array.isArray(data) ? data : [])
      // Los filtros se aplicarán automáticamente en el useEffect
    } catch (error) {
      console.error("Error al buscar pedidos:", error)
      showToast("Error al buscar pedidos: " + error.message, "error")
    } finally {
      setLoading(false)
      setSearching(false)
    }
  }

  const handleEliminarPedido = (id) => {
    toast.custom(
      (t) => (
        <div className="sonner-toast-custom">
          <p className="confirmation-title">¿Está seguro de eliminar este pedido?</p>
          <p className="confirmation-subtitle">Esta acción no se puede deshacer.</p>
          <div className="toast-actions">
            <button
              className="btn btn-small btn-danger"
              onClick={() => {
                toast.dismiss(t)
                confirmarEliminarPedido(id)
              }}
            >
              Eliminar
            </button>
            <button className="btn btn-small btn-secondary" onClick={() => toast.dismiss(t)}>
              Cancelar
            </button>
          </div>
        </div>
      ),
      { duration: 10000 },
    )
  }

  const confirmarEliminarPedido = async (id) => {
    try {
      const res = await fetch(`/api/pedidos/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Error al eliminar el pedido")
      }

      showToast("Pedido eliminado correctamente", "success")
      fetchPedidos()
    } catch (error) {
      console.error("Error al eliminar pedido:", error)
      showToast("Error al eliminar el pedido: " + error.message, "error")
    }
  }

  const getEstadoEntregaLabel = (estado) => {
    switch (estado) {
      case "pendiente":
        return <span className="badge badge-warning badge-rounded">Pendiente</span>
      case "entregado":
        return <span className="badge badge-success badge-rounded">Entregado</span>
      default:
        return <span className="badge badge-secondary badge-rounded">Desconocido</span>
    }
  }

  const getEstadoPagoLabel = (estado) => {
    switch (estado) {
      case "abonado":
        return <span className="badge badge-success badge-rounded">Abonado</span>
      case "a_pagar":
        return <span className="badge badge-warning badge-rounded">A Pagar</span>
      case "resta_abonar":
        return <span className="badge badge-info badge-rounded">Resta Abonar</span>
      default:
        return <span className="badge badge-secondary badge-rounded">Desconocido</span>
    }
  }

  if (loading && !searching) {
    return (
      <div className="presupuestos-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="presupuestos-container">
      <div className="presupuestos-header">
        <h2>Pedidos</h2>
      </div>

      <div className="search-actions-container">
        <div className="search-container">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Buscar por número, cliente o domicilio..."
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
                  setSearchQuery("")
                  fetchPedidos()
                }}
              >
                Limpiar
              </button>
            )}
          </form>
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <select
              id="estadoEntrega"
              className="filter-select"
              value={estadoEntregaFilter}
              onChange={(e) => setEstadoEntregaFilter(e.target.value)}
              aria-label="Filtrar por estado de entrega"
            >
              <option value="todos">Estado Entrega: Todos</option>
              <option value="pendiente">Estado Entrega: Pendiente</option>
              <option value="entregado">Estado Entrega: Entregado</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              id="estadoPago"
              className="filter-select"
              value={estadoPagoFilter}
              onChange={(e) => setEstadoPagoFilter(e.target.value)}
              aria-label="Filtrar por estado de pago"
            >
              <option value="todos">Estado Pago: Todos</option>
              <option value="abonado">Estado Pago: Abonado</option>
              <option value="a_pagar">Estado Pago: A Pagar</option>
              <option value="resta_abonar">Estado Pago: Resta Abonar</option>
            </select>
          </div>

          {filtersActive && (
            <button className="btn-clear-filters" onClick={resetFilters} title="Borrar filtros">
              <Trash2 size={18} color="var(--danger-color)" />
            </button>
          )}
        </div>
      </div>

      {filteredPedidos.length > 0 ? (
        <div className="presupuestos-table-container">
          <table className="presupuestos-table">
            <thead>
              <tr>
                <th className="column-numero">Número</th>
                <th className="column-cliente">Cliente</th>
                <th className="column-fecha">Fecha Entrega</th>
                <th className="column-total">Total</th>
                <th className="column-estado">Estado</th>
                <th className="column-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPedidos.map((pedido) => (
                <tr key={pedido.id} className="presupuesto-row">
                  <td className="column-numero">
                    <div className="numero-container">
                      <FileText size={16} className="icon-inline" /> {pedido.numero}
                    </div>
                  </td>
                  <td className="column-cliente">{pedido.cliente_nombre}</td>
                  <td className="column-fecha">
                    {pedido.fecha_entrega ? new Date(pedido.fecha_entrega).toLocaleDateString() : "No especificada"}
                  </td>
                  <td className="column-total">${Number(pedido.total).toLocaleString()}</td>
                  <td className="column-estado">
                    {getEstadoEntregaLabel(pedido.estado_entrega)} {getEstadoPagoLabel(pedido.estado_pago)}
                  </td>
                  <td className="column-acciones">
                    <div className="acciones-container">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="btn-accion">
                            <MoreVertical size={18} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="dropdown-menu-content">
                          <DropdownMenuItem className="dropdown-menu-item">
                            <Link href={`/pedidos/${pedido.id}`} className="dropdown-menu-link">
                              <Eye size={16} className="dropdown-menu-icon" />
                              <span>Ver Pedido</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="dropdown-menu-item">
                            <Link href={`/pedidos/${pedido.id}/editar`} className="dropdown-menu-link">
                              <Edit size={16} className="dropdown-menu-icon" />
                              <span>Editar Pedido</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="dropdown-menu-item">
                            <Link href={`/pedidos/${pedido.id}`} className="dropdown-menu-link">
                              <FileEdit size={16} className="dropdown-menu-icon" />
                              <span>Editar Estado</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="dropdown-menu-item dropdown-menu-item-danger"
                            onClick={() => handleEliminarPedido(pedido.id)}
                          >
                            <Trash2 size={16} className="dropdown-menu-icon" />
                            <span>Eliminar</span>
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
              {searchQuery || estadoEntregaFilter !== "todos" || estadoPagoFilter !== "todos"
                ? "No se encontraron pedidos con los filtros aplicados"
                : "No hay pedidos disponibles"}
            </p>
            {(searchQuery || estadoEntregaFilter !== "todos" || estadoPagoFilter !== "todos") && (
              <button
                className="btn-secondary"
                onClick={() => {
                  setSearchQuery("")
                  setEstadoEntregaFilter("todos")
                  setEstadoPagoFilter("todos")
                  fetchPedidos()
                }}
              >
                Ver todos los pedidos
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PedidosList

