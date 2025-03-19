"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  TruckIcon as TruckDelivery,
  ClipboardList,
  ChevronRight,
} from "lucide-react";

// Actualizar la importación del CSS Module para que apunte a la carpeta styles
import styles from "@/styles/dashboard.module.css";

const Dashboard = () => {
  const [stats, setStats] = useState({
    pedidosHoy: [],
    pedidosProgramados: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // 'list' o 'calendar'
  const router = useRouter();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Obtener la fecha actual en formato YYYY-MM-DD usando la fecha local
      const today = new Date();
      // Formatear la fecha como YYYY-MM-DD sin componente de tiempo
      const formattedToday = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      console.log("Fecha actual formateada:", formattedToday);

      // Obtener estadísticas de pedidos para hoy
      const pedidosHoyRes = await fetch(
        `/api/pedidos/fecha?fecha=${formattedToday}`
      );
      const pedidosHoyData = await pedidosHoyRes.json();
      const pedidosHoy = Array.isArray(pedidosHoyData) ? pedidosHoyData : [];

      console.log("Pedidos para hoy:", pedidosHoy);

      // Obtener estadísticas de pedidos programados (futuros)
      const pedidosProgramadosRes = await fetch(
        `/api/pedidos/programados?fechaDesde=${formattedToday}`
      );
      const pedidosProgramadosData = await pedidosProgramadosRes.json();

      // Filtrar los pedidos programados para excluir los de hoy
      const pedidosProgramados = Array.isArray(pedidosProgramadosData)
        ? pedidosProgramadosData.filter((pedido) => {
            if (!pedido.fecha_entrega) return true;

            // Convertir la fecha de entrega a formato YYYY-MM-DD
            const fechaEntrega = new Date(pedido.fecha_entrega);
            const formattedFechaEntrega = `${fechaEntrega.getFullYear()}-${String(
              fechaEntrega.getMonth() + 1
            ).padStart(2, "0")}-${String(fechaEntrega.getDate()).padStart(
              2,
              "0"
            )}`;

            console.log(
              "Comparando fechas:",
              formattedFechaEntrega,
              formattedToday,
              formattedFechaEntrega !== formattedToday
            );

            // Devolver true solo si la fecha de entrega NO es hoy
            return formattedFechaEntrega !== formattedToday;
          })
        : [];

      console.log("Pedidos programados filtrados:", pedidosProgramados);

      setStats({
        pedidosHoy,
        pedidosProgramados,
      });

      setLoading(false);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
      setStats({
        pedidosHoy: [],
        pedidosProgramados: [],
      });
      setLoading(false);
    }
  };

  const handleNuevoPresupuesto = () => {
    router.push("/presupuestos/nuevo");
  };

  // Agrupar pedidos programados por fecha
  const pedidosPorFecha = stats.pedidosProgramados.reduce((acc, pedido) => {
    // Asegurarse de que la fecha se maneje como fecha local
    let fechaClave = "Sin fecha";

    if (pedido.fecha_entrega) {
      // Usar directamente la fecha sin manipulación
      const fecha = new Date(pedido.fecha_entrega);
      // Corregir el año si es necesario
      const añoActual = new Date().getFullYear();
      if (fecha.getFullYear() !== añoActual) {
        fecha.setFullYear(añoActual);
      }
      fechaClave = fecha.toISOString().split("T")[0];
      console.log(
        "Fecha de entrega original:",
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

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Panel de Control</h2>
        <button className="btn btn-primary" onClick={handleNuevoPresupuesto}>
          Nuevo Presupuesto
        </button>
      </div>

      <div className="dashboard-cards">
        {/* Card de Pedidos para Hoy */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>
              <TruckDelivery size={20} className="card-icon" /> Pedidos para Hoy
            </h3>
            <span className="card-count">{stats.pedidosHoy.length}</span>
          </div>
          <div className="card-content">
            {stats.pedidosHoy.length > 0 ? (
              <div className="card-list">
                {stats.pedidosHoy.map((pedido) => (
                  <Link
                    href={`/pedidos/${pedido.id}`}
                    key={pedido.id}
                    className="card-item"
                  >
                    <div className="card-item-info" style={{ width: "100%" }}>
                      <div className="flex justify-between items-center w-full">
                        <div className="flex-1 truncate">
                          <span className="font-medium">{pedido.numero}</span> -{" "}
                          {pedido.cliente_nombre} -{" "}
                          {pedido.domicilio || "Sin domicilio"} -{" "}
                          {/* <span className="font-semibold">${pedido.total.toLocaleString()}</span> */}
                          {pedido.estado_entrega === "pendiente" ? (
                            <span className="badge badge-warning ml-2">
                              Pendiente
                            </span>
                          ) : (
                            <span className="badge badge-success ml-2">
                              Entregado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="no-data">No hay pedidos programados para hoy</p>
            )}
          </div>
          <div className="card-footer">
            <Link href="/pedidos" className="card-link">
              Ver todos los pedidos
            </Link>
          </div>
        </div>

        {/* Card de Pedidos Programados */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>
              <Calendar size={20} className="card-icon" /> Pedidos Programados
            </h3>
            <div className="card-header-actions">
              <span className="card-count">
                {stats.pedidosProgramados.length}
              </span>
              <div className="view-toggle">
                <button
                  className={`view-toggle-btn ${
                    viewMode === "list" ? "active" : ""
                  }`}
                  onClick={() => setViewMode("list")}
                >
                  <ClipboardList size={16} />
                </button>
                <button
                  className={`view-toggle-btn ${
                    viewMode === "calendar" ? "active" : ""
                  }`}
                  onClick={() => setViewMode("calendar")}
                >
                  <Calendar size={16} />
                </button>
              </div>
            </div>
          </div>
          <div className="card-content">
            {stats.pedidosProgramados.length > 0 ? (
              viewMode === "list" ? (
                <div className="card-list-grouped">
                  {fechasOrdenadas.map((fecha) => (
                    <div key={fecha} className="date-group">
                      <h4 className="date-header">
                        {formatDate(fecha)}
                        {isToday(fecha) && (
                          <span className="badge badge-primary badge-today">
                            Hoy
                          </span>
                        )}
                      </h4>
                      <div className="date-items">
                        {pedidosPorFecha[fecha].map((pedido) => (
                          <Link
                            href={`/pedidos/${pedido.id}`}
                            key={pedido.id}
                            className="card-item"
                          >
                            <div
                              className="card-item-info"
                              style={{ width: "100%" }}
                            >
                              <div className="flex justify-between items-center w-full">
                                <div className="flex-1 truncate">
                                  <span className="font-medium">
                                    {pedido.numero}
                                  </span>{" "}
                                  - {pedido.cliente_nombre} -{" "}
                                  {pedido.domicilio || "Sin domicilio"} -{" "}
                                  {/* <span className="font-semibold">${pedido.total.toLocaleString()}</span> */}
                                  {pedido.estado_entrega === "pendiente" ? (
                                    <span className="badge badge-warning ml-2">
                                      Pendiente
                                    </span>
                                  ) : (
                                    <span className="badge badge-success ml-2">
                                      Entregado
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <ChevronRight size={16} />
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="calendar-view">
                  <div className="calendar-header">
                    <h4>Calendario de Entregas</h4>
                  </div>
                  <div className="calendar-dates">
                    {fechasOrdenadas
                      .filter((fecha) => fecha !== "Sin fecha")
                      .map((fecha) => (
                        <div
                          key={fecha}
                          className={`calendar-date ${
                            selectedDate === fecha ? "selected" : ""
                          } ${isToday(fecha) ? "today" : ""}`}
                          onClick={() =>
                            setSelectedDate(
                              selectedDate === fecha ? null : fecha
                            )
                          }
                        >
                          <div className="calendar-date-header">
                            <span className="calendar-day">
                              {new Date(fecha + "T00:00:00").getDate()}
                            </span>
                            <span className="calendar-month">
                              {new Date(fecha + "T00:00:00").toLocaleDateString(
                                "es-ES",
                                { month: "short" }
                              )}
                            </span>
                          </div>
                          <div className="calendar-date-count">
                            <span className={styles.calendarCountNumber}>
                              {pedidosPorFecha[fecha].length}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>

                  {selectedDate && (
                    <div className="calendar-selected-date">
                      <h5>
                        {formatDate(selectedDate)}
                        {isToday(selectedDate) && (
                          <span className="badge badge-primary badge-today">
                            Hoy
                          </span>
                        )}
                      </h5>
                      <div className="calendar-selected-items">
                        {pedidosPorFecha[selectedDate].map((pedido) => (
                          <Link
                            href={`/pedidos/${pedido.id}`}
                            key={pedido.id}
                            className="card-item"
                          >
                            <div
                              className="card-item-info"
                              style={{ width: "100%" }}
                            >
                              <div className="flex justify-between items-center w-full">
                                <div className="flex-1 truncate">
                                  <span className="font-medium">
                                    {pedido.numero}
                                  </span>{" "}
                                  - {pedido.cliente_nombre} -{" "}
                                  {pedido.domicilio || "Sin domicilio"} -{" "}
                                  {/* <span className="font-semibold">${pedido.total.toLocaleString()}</span> */}
                                  {pedido.estado_entrega === "pendiente" ? (
                                    <span className="badge badge-warning ml-2">
                                      Pendiente
                                    </span>
                                  ) : (
                                    <span className="badge badge-success ml-2">
                                      Entregado
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <ChevronRight size={16} />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              <p className="no-data">No hay pedidos programados</p>
            )}
          </div>
          <div className="card-footer">
            <Link href="/pedidos/programados" className="card-link">
              Ver todos los pedidos programados
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
