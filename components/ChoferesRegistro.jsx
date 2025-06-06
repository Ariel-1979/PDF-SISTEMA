"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  DollarSign,
  Truck,
  Calendar,
  User,
  MapPin,
  Settings,
  PlusCircle,
} from "lucide-react";
import Link from "next/link";
import {
  getTodayDateString,
  formatFullDate,
  formatDateToString,
} from "@/lib/date-utils";
import CustomDatePicker from "./CustomDatePicker";
import "@/styles/choferes.css";

const ChoferesRegistro = () => {
  const [choferes, setChoferes] = useState([]);
  const [pedidosPorChofer, setPedidosPorChofer] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [error, setError] = useState(null);

  // Usar la utilidad para obtener la fecha actual en formato YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());

  const { showToast } = useToast();

  useEffect(() => {
    fetchChoferes();
  }, []);

  useEffect(() => {
    if (choferes.length > 0) {
      fetchPedidosPorFecha();
    }
  }, [selectedDate, choferes]);

  const fetchChoferes = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/choferes");

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Error al cargar choferes: ${res.status}`
        );
      }

      const data = await res.json();
      setChoferes(Array.isArray(data) ? data : []);

      if (Array.isArray(data) && data.length > 0) {
        fetchPedidosPorFecha();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error al cargar choferes:", error);
      setError(error.message);
      showToast(`Error al cargar choferes: ${error.message}`, "error");
      setLoading(false);
    }
  };

  const fetchPedidosPorFecha = async () => {
    try {
      setLoadingPedidos(true);

      // Crear un objeto para almacenar todos los pedidos
      const pedidosTemp = {};

      // Inicializar con array vacío para cada chofer
      choferes.forEach((chofer) => {
        pedidosTemp[chofer.nombre] = [];
      });

      // Para cada chofer, buscar sus pedidos
      await Promise.all(
        choferes.map(async (chofer) => {
          try {
            // Usar la nueva ruta API
            const res = await fetch(
              `/api/choferes/pedidos?nombre=${encodeURIComponent(
                chofer.nombre
              )}`
            );

            if (!res.ok) {
              console.error(
                `Error al obtener pedidos para ${chofer.nombre}: ${res.status} ${res.statusText}`
              );
              throw new Error(`Error al obtener pedidos: ${res.status}`);
            }

            const data = await res.json();

            // Filtrar pedidos para la fecha seleccionada
            const pedidosFiltrados = Array.isArray(data)
              ? data.filter((pedido) => {
                  // Verificar si el pedido tiene fecha_entrega
                  if (!pedido.fecha_entrega) return false;

                  // Obtener solo la parte de fecha (YYYY-MM-DD) de ambas fechas
                  const fechaSeleccionada = selectedDate.split("T")[0];

                  // Convertir la fecha de entrega a formato YYYY-MM-DD
                  const fechaPedido = formatDateToString(pedido.fecha_entrega);

                  // Comparar las fechas como cadenas en formato YYYY-MM-DD
                  return fechaPedido === fechaSeleccionada;
                })
              : [];

            pedidosTemp[chofer.nombre] = pedidosFiltrados;
          } catch (error) {
            console.error(
              `Error al cargar pedidos del chofer ${chofer.nombre}:`,
              error
            );
            // Mantener el array vacío para este chofer en caso de error
            pedidosTemp[chofer.nombre] = [];
          }
        })
      );

      setPedidosPorChofer(pedidosTemp);
    } catch (error) {
      console.error(`Error al cargar pedidos:`, error);
      showToast(`Error al cargar pedidos: ${error.message}`, "error");
    } finally {
      setLoadingPedidos(false);
      setLoading(false);
    }
  };

  const calcularTotalArqueo = (pedidos) => {
    return pedidos
      .filter(
        (pedido) =>
          pedido.estado_pago === "a_pagar" ||
          pedido.estado_pago === "resta_abonar"
      )
      .reduce((total, pedido) => {
        if (pedido.estado_pago === "a_pagar") {
          return total + Number(pedido.total || 0);
        } else {
          return total + Number(pedido.monto_restante || 0);
        }
      }, 0);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  if (loading) {
    return (
      <div className="choferes-container">
        <div className="loading">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="choferes-container">
        <div className="error-container">
          <h3>Error al cargar datos</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchChoferes}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="choferes-container">
      <div className="choferes-header">
        <h2>Registro de Pedidos por Chofer</h2>
        <div className="header-actions">
          <Link href="/choferes/admin" className="btn btn-primary">
            <Settings size={18} className="mr-2" />
            Administrar Choferes
          </Link>
        </div>
      </div>

      {/* Selector de fecha */}
      <div className="fecha-selector-container">
        <div className="fecha-selector">
          <Calendar size={18} className="fecha-icon" />
          <span className="fecha-label">Fecha:</span>
          <CustomDatePicker
            value={selectedDate}
            onChange={handleDateChange}
            className="fecha-input"
          />
          <span className="fecha-display">{formatFullDate(selectedDate)}</span>
        </div>
      </div>

      {loadingPedidos ? (
        <div className="loading">Cargando pedidos...</div>
      ) : choferes.length > 0 ? (
        <div className="choferes-cards-container">
          <div className="choferes-cards-grid">
            {choferes.map((chofer) => {
              const pedidosChofer = pedidosPorChofer[chofer.nombre] || [];
              const totalArqueo = calcularTotalArqueo(pedidosChofer);

              return (
                <div key={chofer.id} className="chofer-card">
                  <div className="chofer-card-header">
                    <div className="chofer-info">
                      <Truck size={20} className="chofer-icon" />
                      <h3>{chofer.nombre}</h3>
                    </div>
                    <div className="pedidos-count">
                      <span>{pedidosChofer.length} pedido(s)</span>
                    </div>
                  </div>

                  <div className="chofer-card-content">
                    {pedidosChofer.length > 0 ? (
                      <div className="pedidos-list-compact">
                        {pedidosChofer.map((pedido) => (
                          <Link
                            href={`/pedidos/${pedido.id}`}
                            key={pedido.id}
                            className="pedido-item-compact"
                          >
                            <div className="pedido-item-header">
                              <span className="pedido-numero">
                                <FileText size={16} className="icon-inline" />{" "}
                                {pedido.numero}
                              </span>
                              <span
                                className={`pedido-estado ${
                                  pedido.estado_pago === "abonado"
                                    ? "estado-abonado"
                                    : "estado-pendiente"
                                }`}
                              >
                                {pedido.estado_pago === "abonado"
                                  ? "Abonado"
                                  : "A Cobrar"}
                              </span>
                            </div>
                            <div className="pedido-item-details">
                              <div className="pedido-cliente">
                                <User size={14} className="icon-inline" />{" "}
                                {pedido.cliente_nombre}
                              </div>
                              <div className="pedido-monto">
                                <DollarSign size={14} className="icon-inline" />
                                {pedido.estado_pago === "abonado"
                                  ? "$0"
                                  : pedido.estado_pago === "a_pagar"
                                  ? `$${Number(
                                      pedido.total || 0
                                    ).toLocaleString()}`
                                  : `$${Number(
                                      pedido.monto_restante || 0
                                    ).toLocaleString()}`}
                              </div>
                            </div>
                            <div className="pedido-direccion">
                              <MapPin size={14} className="icon-inline" />
                              {pedido.cliente_domicilio ||
                                "Sin dirección especificada"}
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="no-pedidos">
                        No hay pedidos para esta fecha
                      </p>
                    )}
                  </div>

                  <div className="chofer-card-footer">
                    <div className="total-arqueo">
                      <span>Total a Cobrar:</span>
                      <span className="monto-total">
                        ${totalArqueo.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="no-data-container">
          <p className="no-data">No hay choferes registrados</p>
          <Link href="/choferes/admin" className="btn btn-primary">
            <PlusCircle size={18} className="mr-2" />
            Agregar Choferes
          </Link>
        </div>
      )}
    </div>
  );
};

export default ChoferesRegistro;
