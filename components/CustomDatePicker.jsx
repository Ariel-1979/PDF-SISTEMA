"use client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const CustomDatePicker = ({ value, onChange }) => {
  // Función para convertir string a Date manteniendo la fecha local
  const stringToLocalDate = (dateString) => {
    if (!dateString) return new Date();

    // Parsear la fecha en formato YYYY-MM-DD
    const [year, month, day] = dateString
      .split("-")
      .map((num) => Number.parseInt(num, 10));

    // Crear una nueva fecha usando la fecha local (sin ajuste de zona horaria)
    return new Date(year, month - 1, day);
  };

  // Función para convertir Date a string en formato YYYY-MM-DD
  const localDateToString = (date) => {
    if (!date) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // Formatear la fecha para mostrar
  const formattedDate = value
    ? format(stringToLocalDate(value), "EEEE, d 'de' MMMM 'de' yyyy", {
        locale: es,
      })
    : "Seleccionar fecha";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="date-picker-button">
          <span className="date-picker-value">{formattedDate}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="date-picker-popover" align="start">
        <Calendar
          mode="single"
          selected={stringToLocalDate(value)}
          onSelect={(date) => onChange(date ? localDateToString(date) : "")}
          initialFocus
          locale={es}
        />
      </PopoverContent>
    </Popover>
  );
};

export default CustomDatePicker;
