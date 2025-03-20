/**
 * Utilidades para manejar fechas de manera consistente en toda la aplicación
 * y evitar problemas de zona horaria
 */

// Obtener la fecha actual en formato YYYY-MM-DD, ajustada a la zona horaria local
export function getTodayDateString() {
  const today = new Date();

  // Formatear como YYYY-MM-DD usando la fecha local
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Convertir una fecha a formato YYYY-MM-DD
export function formatDateToString(date) {
  if (!date) return "";

  // Si es string, convertir a objeto Date
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Usar la fecha local para evitar problemas de zona horaria
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Formatear fecha para mostrar en español
export function formatDateToDisplay(date) {
  if (!date) return "";

  try {
    // Si es string, convertir a objeto Date manteniendo la fecha local
    let dateObj;
    if (typeof date === "string") {
      // Si es formato YYYY-MM-DD
      if (date.includes("-")) {
        const [year, month, day] = date
          .split("-")
          .map((num) => Number.parseInt(num, 10));
        dateObj = new Date(year, month - 1, day);
      } else {
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }

    // Formatear usando Intl.DateTimeFormat para mayor consistencia
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(dateObj);
  } catch (e) {
    console.error("Error al formatear fecha:", e);
    return String(date);
  }
}

// Formatear fecha completa con día de la semana
export function formatFullDate(date) {
  if (!date) return "";

  try {
    // Si es string, convertir a objeto Date manteniendo la fecha local
    let dateObj;
    if (typeof date === "string") {
      // Si es formato YYYY-MM-DD
      if (date.includes("-")) {
        const [year, month, day] = date
          .split("-")
          .map((num) => Number.parseInt(num, 10));
        dateObj = new Date(year, month - 1, day);
      } else {
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }

    // Formatear usando Intl.DateTimeFormat para mayor consistencia
    return new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(dateObj);
  } catch (e) {
    console.error("Error al formatear fecha completa:", e);
    return String(date);
  }
}

// Comparar si dos fechas son el mismo día (ignorando la hora)
export function isSameDay(date1, date2) {
  if (!date1 || !date2) return false;

  // Convertir a strings YYYY-MM-DD para comparar solo la fecha
  const date1Str = formatDateToString(date1);
  const date2Str = formatDateToString(date2);

  return date1Str === date2Str;
}

// Obtener objeto Date ajustado a la zona horaria de Argentina
export function getArgentinaDate(date = new Date()) {
  // Crear copia de la fecha
  const dateObj = new Date(date);

  // Ajustar a la zona horaria de Argentina (UTC-3)
  const argentinaOffset = -3 * 60; // -3 horas en minutos
  const userOffset = dateObj.getTimezoneOffset(); // Offset del usuario en minutos
  const offsetDiff = userOffset - argentinaOffset; // Diferencia en minutos

  // Ajustar la fecha según la diferencia de zona horaria
  dateObj.setMinutes(dateObj.getMinutes() + offsetDiff);

  return dateObj;
}
