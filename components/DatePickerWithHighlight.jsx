"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import styles from "@/styles/pedidos.module.css";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const DatePickerWithHighlight = ({
  value,
  onChange,
  datesWithPedidos = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(
    value ? new Date(value) : new Date()
  );
  const calendarRef = useRef(null);

  // Convertir las fechas con pedidos a un formato comparable
  const formattedDatesWithPedidos = datesWithPedidos.map((date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  });

  // Cerrar el calendario al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Obtener el primer día del mes actual
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  // Obtener el número de días en el mes actual
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Generar los días del mes para mostrar en el calendario
  const generateDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = getFirstDayOfMonth(year, month);
    const daysInMonth = getDaysInMonth(year, month);

    // Días del mes anterior
    const daysInPrevMonth = getDaysInMonth(year, month - 1);
    const prevMonthDays = Array.from({ length: firstDay }, (_, i) => ({
      day: daysInPrevMonth - firstDay + i + 1,
      isCurrentMonth: false,
      isPrevMonth: true,
    }));

    // Días del mes actual
    const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      isCurrentMonth: true,
    }));

    // Días del mes siguiente
    const remainingDays = 42 - (prevMonthDays.length + currentMonthDays.length);
    const nextMonthDays = Array.from({ length: remainingDays }, (_, i) => ({
      day: i + 1,
      isCurrentMonth: false,
      isNextMonth: true,
    }));

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

  // Navegar al mes anterior
  const prevMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  // Navegar al mes siguiente
  const nextMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  // Seleccionar un día
  const selectDay = (day, isCurrentMonth, isPrevMonth, isNextMonth) => {
    if (!isCurrentMonth) {
      // Si se selecciona un día de otro mes, cambiar al mes correspondiente
      if (isPrevMonth) {
        prevMonth();
      } else if (isNextMonth) {
        nextMonth();
      }
    }

    const newDate = new Date(currentDate);
    newDate.setDate(day);

    if (isPrevMonth) {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (isNextMonth) {
      newDate.setMonth(newDate.getMonth() + 1);
    }

    // Formatear la fecha como YYYY-MM-DD
    const formattedDate = `${newDate.getFullYear()}-${String(
      newDate.getMonth() + 1
    ).padStart(2, "0")}-${String(newDate.getDate()).padStart(2, "0")}`;

    onChange(formattedDate);
    setIsOpen(false);
  };

  // Verificar si un día tiene pedidos
  const hasPedidos = (day, isCurrentMonth, isPrevMonth, isNextMonth) => {
    if (!isCurrentMonth) return false;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, day);
    const formattedDate = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    return formattedDatesWithPedidos.includes(formattedDate);
  };

  // Verificar si un día es hoy
  const isToday = (day, isCurrentMonth) => {
    if (!isCurrentMonth) return false;

    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  // Verificar si un día está seleccionado
  const isSelected = (day, isCurrentMonth, isPrevMonth, isNextMonth) => {
    if (!value) return false;

    const selectedDate = new Date(value);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    let dateToCheck = new Date(year, month, day);

    if (isPrevMonth) {
      dateToCheck = new Date(year, month - 1, day);
    } else if (isNextMonth) {
      dateToCheck = new Date(year, month + 1, day);
    }

    return (
      selectedDate.getDate() === dateToCheck.getDate() &&
      selectedDate.getMonth() === dateToCheck.getMonth() &&
      selectedDate.getFullYear() === dateToCheck.getFullYear()
    );
  };

  // Formatear la fecha para mostrar en el input
  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()}`;
  };

  // Limpiar la selección
  const clearSelection = () => {
    onChange("");
    setIsOpen(false);
  };

  // Seleccionar hoy
  const selectToday = () => {
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    onChange(formattedDate);
    setCurrentDate(today);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={calendarRef}>
      <div className="relative">
        <input
          type="text"
          className={styles.dateFilter}
          value={formatDisplayDate(value)}
          onClick={() => setIsOpen(!isOpen)}
          readOnly
          placeholder="Seleccionar fecha"
        />
        <Calendar
          size={18}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
      </div>

      {isOpen && (
        <div className={styles.calendarContainer}>
          <div className={styles.calendarHeader}>
            <button
              className={styles.calendarNavButton}
              onClick={prevMonth}
              aria-label="Mes anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <div className={styles.calendarTitle}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>
            <button
              className={styles.calendarNavButton}
              onClick={nextMonth}
              aria-label="Mes siguiente"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className={styles.calendarGrid}>
            {DAYS.map((day) => (
              <div key={day} className={styles.calendarWeekday}>
                {day}
              </div>
            ))}

            {generateDays().map((day, index) => (
              <div
                key={index}
                className={`
                  ${styles.calendarDay}
                  ${day.isCurrentMonth ? "" : styles.calendarDayOutside}
                  ${
                    isToday(day.day, day.isCurrentMonth)
                      ? styles.calendarDayToday
                      : ""
                  }
                  ${
                    isSelected(
                      day.day,
                      day.isCurrentMonth,
                      day.isPrevMonth,
                      day.isNextMonth
                    )
                      ? styles.calendarDaySelected
                      : ""
                  }
                  ${
                    hasPedidos(
                      day.day,
                      day.isCurrentMonth,
                      day.isPrevMonth,
                      day.isNextMonth
                    )
                      ? styles.calendarDayWithPedidos
                      : ""
                  }
                `}
                onClick={() =>
                  selectDay(
                    day.day,
                    day.isCurrentMonth,
                    day.isPrevMonth,
                    day.isNextMonth
                  )
                }
              >
                {day.day}
              </div>
            ))}
          </div>

          <div className={styles.calendarFooter}>
            <button
              className={styles.calendarFooterButton}
              onClick={clearSelection}
            >
              Limpiar
            </button>
            <button
              className={`${styles.calendarFooterButton} ${styles.calendarFooterButtonPrimary}`}
              onClick={selectToday}
            >
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePickerWithHighlight;
