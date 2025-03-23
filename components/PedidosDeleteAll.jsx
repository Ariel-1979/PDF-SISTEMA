"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function PedidosDeleteAll() {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/pedidos/delete-all", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar los pedidos");
      }

      const data = await response.json();
      toast.success(`Se eliminaron ${data.count} pedidos correctamente`);

      // Primero refrescamos la página usando router.refresh()
      router.refresh();

      // Luego forzamos una recarga completa después de un breve retraso
      // para asegurar que los datos se actualicen completamente
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (error) {
      toast.error(
        `Error: ${error instanceof Error ? error.message : "Error desconocido"}`
      );
      setIsDeleting(false);
    }
  };

  const confirmDeleteAll = () => {
    toast.custom(
      (t) => (
        <div className="sonner-toast-custom">
          <p className="confirmation-title">
            ¿Está seguro de eliminar TODOS los pedidos?
          </p>
          <p className="confirmation-subtitle">
            Esta acción eliminará todos los pedidos y sus clientes asociados. No
            se puede deshacer.
          </p>
          <div className="toast-actions">
            <button
              className="btn btn-small btn-danger"
              onClick={() => {
                toast.dismiss(t);
                handleDeleteAll();
              }}
            >
              Eliminar Todos
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
      {
        duration: Number.POSITIVE_INFINITY,
        position: "top-center",
      }
    );
  };

  return (
    <button
      onClick={confirmDeleteAll}
      disabled={isDeleting}
      className="btn btn-danger btn-icon"
      title="Eliminar todos los pedidos"
    >
      <Trash2 size={16} />
      <span>{isDeleting ? "Eliminando..." : "Eliminar Todos"}</span>
    </button>
  );
}
