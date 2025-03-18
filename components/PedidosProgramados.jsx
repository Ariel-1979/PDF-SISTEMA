"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
} from "lucide-react";

const PedidosProgramados = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDates, setExpandedDates] = useState({});
  const { showToast } = useToast();

  useEffect(() => {
    fetchPedidosProgramados();
  }, []);

  const fetchPedidosProgramados = async () => {
    try {
      setLoading(true);
      // Obtener la fecha actual en formato YYYY-MM-DD usando la fecha local
      const today = new Date();
      const formattedToday = today.toISOString().split("T")[0];

      const res = await fetch(
        `/api/pedidos/programados?fechaDesde=${formattedToday}`
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || "Error al cargar pedidos programados"
        );
      }

      const data = await res.json();
      setPedidos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar pedidos programados:", error);
      showToast(
        "Error al cargar pedidos programados: " + error.message,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Agrupar pedidos por fecha
  const pedidosPorFecha = pedidos.reduce((acc, pedido) => {
    let fechaClave = "Sin fecha";

    if (pedido.fecha_entrega) {
      // Crear una fecha a partir de la fecha de entrega
      const fecha = new Date(pedido.fecha_entrega);
      // Corregir el año si es necesario
      const añoActual = new Date().getFullYear();
      if (fecha.getFullYear() !== añoActual) {
        fecha.setFullYear(añoActual);
      }
      fechaClave = fecha.toISOString().split("T")[0];
      console.log(
        "PedidosProgramados - Fecha de entrega original:",
        pedido.fecha_entrega,
        "Fecha clave corregida:",
        fechaClave
      );
    }

    if (!acc[fechaClave]) {
      acc[fechaClave] = [];
    }
    acc[fechaClave].push(pedido);
    return acc;
  }, {});

  // Obtener fechas ordenadas
  const fechasOrdenadas = Object.keys(pedidosPorFecha)
    .filter((fecha) => fecha !== "Sin fecha")
    .sort((a, b) => new Date(a) - new Date(b));

  if (pedidosPorFecha["Sin fecha"]) {
    fechasOrdenadas.push("Sin fecha");
  }

  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    if (dateString === "Sin fecha") return "Sin fecha asignada";

    try {
      // Crear una fecha directamente desde el string YYYY-MM-DD
      const date = new Date(dateString + "T00:00:00");

      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        console.error("Fecha inválida:", dateString);
        return "Fecha inválida";
      }

      // Formatear la fecha correctamente
      return date.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error al formatear fecha:", error, dateString);
      return "Error de fecha";
    }
  };

  // Verificar si una fecha es hoy
  const isToday = (dateString) => {
    if (dateString === "Sin fecha") return false;

    const today = new Date();
    const todayFormatted = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    return dateString === todayFormatted;
  };

  const toggleDateExpand = (fecha) => {
    setExpandedDates((prev) => ({
      ...prev,
      [fecha]: !prev[fecha],
    }));
  };

  const getEstadoEntregaLabel = (estado) => {
    switch (estado) {
      case "pendiente":
        return <span className="badge badge-warning">Pendiente</span>;
      case "entregado":
        return <span className="badge badge-success">Entregado</span>;
      default:
        return <span className="badge badge-secondary">Desconocido</span>;
    }
  };

  const getEstadoPagoLabel = (estado) => {
    switch (estado) {
      case "abonado":
        return <span className="badge badge-success">Abonado</span>;
      case "a_pagar":
        return <span className="badge badge-warning">A Pagar</span>;
      case "resta_abonar":
        return <span className="badge badge-info">Resta Abonar</span>;
      default:
        return <span className="badge badge-secondary">Desconocido</span>;
    }
  };

  if (loading) {
    return (
      <div className="pedidos-container">
        <div className="loading">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="pedidos-container">
      <div className="pedidos-header">
        <h2>Pedidos Programados</h2>
      </div>

      {pedidos.length > 0 ? (
        <div className="pedidos-programados">
          {fechasOrdenadas.map((fecha) => (
            <div key={fecha} className="fecha-grupo">
              <div
                className="fecha-header"
                onClick={() => toggleDateExpand(fecha)}
              >
                <div className="fecha-info">
                  <Calendar size={20} className="fecha-icon" />
                  <h3>
                    {formatDate(fecha)}
                    {isToday(fecha) && (
                      <span className="badge badge-primary badge-today">
                        Hoy
                      </span>
                    )}
                  </h3>
                  <span className="fecha-count">
                    {pedidosPorFecha[fecha].length} pedido(s)
                  </span>
                </div>
                {expandedDates[fecha] ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </div>

              {expandedDates[fecha] && (
                <div className="pedidos-list">
                  <div className="pedidos-list-header">
                    <div className="pedido-column">Número</div>
                    <div className="pedido-column">Cliente</div>
                    <div className="pedido-column">Total</div>
                    <div className="pedido-column">Estado Entrega</div>
                    <div className="pedido-column">Estado Pago</div>
                    <div className="pedido-column">Acciones</div>
                  </div>

                  {pedidosPorFecha[fecha].map((pedido) => (
                    <div key={pedido.id} className="pedido-item">
                      <div className="pedido-column" data-label="Número">
                        <FileText size={16} className="icon-inline" />{" "}
                        {pedido.numero}
                      </div>
                      <div className="pedido-column" data-label="Cliente">
                        {pedido.cliente_nombre}
                      </div>
                      <div className="pedido-column" data-label="Total">
                        ${Number(pedido.total).toLocaleString()}
                      </div>
                      <div
                        className="pedido-column"
                        data-label="Estado Entrega"
                      >
                        {getEstadoEntregaLabel(pedido.estado_entrega)}
                      </div>
                      <div className="pedido-column" data-label="Estado Pago">
                        {getEstadoPagoLabel(pedido.estado_pago)}
                      </div>
                      <div
                        className="pedido-column pedido-actions"
                        data-label="Acciones"
                      >
                        <Link
                          href={`/pedidos/${pedido.id}`}
                          className="btn btn-small btn-view btn-icon-only"
                          title="Ver"
                        >
                          <Eye size={18} />
                        </Link>
                        <Link
                          href={`/pedidos/${pedido.id}/editar`}
                          className="btn btn-small btn-edit btn-icon-only"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="no-data">No hay pedidos programados</p>
      )}
    </div>
  );
};

export default PedidosProgramados;
