/**
 * Formatea un número para mostrar en la interfaz de usuario
 * @param {number} number - El número a formatear
 * @param {boolean} useLocale - Si se debe usar el formato local (solo en cliente)
 * @returns {string} El número formateado
 */
export function formatNumber(number, useLocale = false) {
  if (typeof window === "undefined" || !useLocale) {
    // En el servidor o cuando no queremos usar locale
    return Math.round(number).toString();
  } else {
    // En el cliente con locale
    return number.toLocaleString("es-AR");
  }
}

/**
 * Formatea un precio para mostrar en la interfaz de usuario
 * @param {number} price - El precio a formatear
 * @param {boolean} useLocale - Si se debe usar el formato local (solo en cliente)
 * @returns {string} El precio formateado
 */
export function formatPrice(price, useLocale = false) {
  if (typeof window === "undefined" || !useLocale) {
    // En el servidor o cuando no queremos usar locale
    return `$${Math.round(price)}`;
  } else {
    // En el cliente con locale
    return `$${price.toLocaleString("es-AR")}`;
  }
}

/**
 * Formatea una fecha para mostrar en la interfaz de usuario
 * @param {string|Date} date - La fecha a formatear
 * @param {boolean} useLocale - Si se debe usar el formato local (solo en cliente)
 * @returns {string} La fecha formateada
 */
export function formatDate(date, useLocale = false) {
  if (typeof window === "undefined" || !useLocale) {
    // En el servidor, devolvemos un formato ISO simple
    return new Date(date).toISOString().split("T")[0];
  } else {
    // En el cliente, usamos el formato local
    return new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
}
