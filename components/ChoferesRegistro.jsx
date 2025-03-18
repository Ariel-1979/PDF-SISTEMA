"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import ChoferForm from "./ChoferForm"
import { FileText, DollarSign } from "lucide-react"

const ChoferesRegistro = () => {
  const [choferes, setChoferes] = useState([])
  const [pedidosChofer, setPedidosChofer] = useState([])
  const [selectedChofer, setSelectedChofer] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadingPedidos, setLoadingPedidos] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    fetchChoferes()
  }, [])

  const fetchChoferes = async () => {
    try {
      const res = await fetch("/api/choferes")
      const data = await res.json()
      setChoferes(Array.isArray(data) ? data : [])
      setLoading(false)
    } catch (error) {
      console.error("Error al cargar choferes:", error)
      showToast("Error al cargar choferes", "error")
      setLoading(false)
    }
  }

  const handleChoferChange = async (e) => {
    const chofer = e.target.value
    setSelectedChofer(chofer)

    if (!chofer) {
      setPedidosChofer([])
      return
    }

    try {
      setLoadingPedidos(true)
      const res = await fetch(`/api/choferes/${chofer}/pedidos`)
      const data = await res.json()
      setPedidosChofer(Array.isArray(data) ? data : [])
      setLoadingPedidos(false)
    } catch (error) {
      console.error("Error al cargar pedidos del chofer:", error)
      showToast("Error al cargar pedidos del chofer", "error")
      setLoadingPedidos(false)
    }
  }

  const calcularTotalArqueo = () => {
    return pedidosChofer
      .filter((pedido) => pedido.estado_pago === "a_pagar" || pedido.estado_pago === "resta_abonar")
      .reduce((total, pedido) => {
        if (pedido.estado_pago === "a_pagar") {
          return total + Number(pedido.total)
        } else {
          return total + Number(pedido.monto_restante)
        }
      }, 0)
  }

  if (loading) {
    return (
      <div className="choferes-container">
        <div className="loading">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="choferes-container">
      <div className="choferes-header">
        <h2>Registro de Pedidos por Chofer</h2>
      </div>

      {/* Formulario para agregar choferes */}
      <ChoferForm onChoferAdded={fetchChoferes} />

      <div className="chofer-select-container">
        <label htmlFor="chofer" className="form-label">
          Seleccionar Chofer
        </label>
        <select id="chofer" className="form-control" value={selectedChofer} onChange={handleChoferChange}>
          <option value="">Seleccione un chofer</option>
          {choferes.map((chofer) => (
            <option key={chofer.id} value={chofer.nombre}>
              {chofer.nombre}
            </option>
          ))}
        </select>
      </div>

      {loadingPedidos ? (
        <div className="loading">Cargando pedidos...</div>
      ) : selectedChofer && pedidosChofer.length > 0 ? (
        <div className="pedidos-chofer">
          <h3>Pedidos entregados por {selectedChofer}</h3>

          <div className="pedidos-list">
            <div className="pedidos-list-header">
              <div className="pedido-column">Número</div>
              <div className="pedido-column">Cliente</div>
              <div className="pedido-column">Fecha</div>
              <div className="pedido-column">Total</div>
              <div className="pedido-column">Estado Pago</div>
              <div className="pedido-column">A Cobrar</div>
            </div>

            {pedidosChofer.map((pedido) => (
              <div key={pedido.id} className="pedido-item">
                <div className="pedido-column" data-label="Número">
                  <FileText size={16} className="icon-inline" /> {pedido.numero}
                </div>
                <div className="pedido-column" data-label="Cliente">
                  {pedido.cliente_nombre}
                </div>
                <div className="pedido-column" data-label="Fecha">
                  {new Date(pedido.fecha_conversion || pedido.fecha_creacion).toLocaleDateString()}
                </div>
                <div className="pedido-column" data-label="Total">
                  <DollarSign size={16} className="icon-inline" /> ${Number(pedido.total).toLocaleString()}
                </div>
                <div className="pedido-column" data-label="Estado Pago">
                  {pedido.estado_pago === "abonado"
                    ? "Abonado"
                    : pedido.estado_pago === "a_pagar"
                      ? "A Pagar"
                      : "Resta Abonar"}
                </div>
                <div className="pedido-column" data-label="A Cobrar">
                  <DollarSign size={16} className="icon-inline" />
                  {pedido.estado_pago === "abonado"
                    ? "$0"
                    : pedido.estado_pago === "a_pagar"
                      ? `$${Number(pedido.total).toLocaleString()}`
                      : `$${Number(pedido.monto_restante).toLocaleString()}`}
                </div>
              </div>
            ))}
          </div>

          <div className="arqueo-total">
            <h3>Total a Cobrar: ${calcularTotalArqueo().toLocaleString()}</h3>
            <p className="arqueo-nota">* Este total incluye solo los pedidos con estado "A Pagar" y "Resta Abonar"</p>
          </div>
        </div>
      ) : selectedChofer ? (
        <p className="no-data">No hay pedidos registrados para este chofer</p>
      ) : null}
    </div>
  )
}

export default ChoferesRegistro

