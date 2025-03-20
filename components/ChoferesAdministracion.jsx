"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  PlusCircle,
  Edit,
  Trash2,
  Save,
  X,
  Truck,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import "@/styles/choferes.css";

const ChoferesAdministracion = () => {
  const [choferes, setChoferes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingNombre, setEditingNombre] = useState("");
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchChoferes();
  }, []);

  const fetchChoferes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/choferes");
      const data = await res.json();
      setChoferes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar choferes:", error);
      showToast("Error al cargar choferes", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombre.trim()) {
      showToast("Debe ingresar un nombre para el chofer", "error");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/choferes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombre }),
      });

      if (!response.ok) {
        throw new Error("Error al guardar el chofer");
      }

      showToast(`Chofer ${nombre} agregado correctamente`, "success");
      setNombre("");
      fetchChoferes();
    } catch (error) {
      console.error("Error al agregar chofer:", error);
      showToast(`Error al agregar el chofer: ${error.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (id, nombre) => {
    setEditingId(id);
    setEditingNombre(nombre);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingNombre("");
  };

  const handleSaveEdit = async (id) => {
    if (!editingNombre.trim()) {
      showToast("El nombre no puede estar vacío", "error");
      return;
    }

    try {
      // Usar la nueva ruta API para editar choferes
      const response = await fetch("/api/choferes/editar", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, nombre: editingNombre }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al actualizar el chofer");
      }

      showToast(`Chofer actualizado correctamente`, "success");
      setEditingId(null);
      fetchChoferes();
    } catch (error) {
      console.error("Error al actualizar chofer:", error);
      showToast(`Error al actualizar el chofer: ${error.message}`, "error");
    }
  };

  const handleDelete = async (id, nombre) => {
    try {
      setDeleting(true);

      // Usar la nueva ruta API para eliminar choferes
      const response = await fetch("/api/choferes/eliminar", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al eliminar el chofer");
      }

      showToast(`Chofer ${nombre} eliminado correctamente`, "success");
      fetchChoferes();
    } catch (error) {
      console.error("Error al eliminar chofer:", error);
      showToast(`Error al eliminar el chofer: ${error.message}`, "error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="choferes-container">
        <div className="loading">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="choferes-container">
      <div className="choferes-header">
        <h2>Administración de Choferes</h2>
        <div className="header-actions">
          <Link href="/choferes" className="btn btn-secondary">
            <ArrowLeft size={18} className="mr-2" />
            Volver a Pedidos
          </Link>
        </div>
      </div>

      <div className="admin-cards-container">
        {/* Card para agregar choferes */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>
              <PlusCircle size={18} className="mr-2" />
              Agregar Nuevo Chofer
            </h3>
          </div>
          <div className="admin-card-content">
            <form onSubmit={handleSubmit} className="chofer-form">
              <div className="form-group">
                <label htmlFor="nombre" className="form-label">
                  Nombre del Chofer
                </label>
                <div className="chofer-input-group">
                  <input
                    type="text"
                    id="nombre"
                    className="form-control"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ingrese el nombre del chofer"
                  />
                  <button
                    type="submit"
                    className="btn btn-primary btn-icon"
                    disabled={saving}
                  >
                    <PlusCircle size={18} />
                    <span>{saving ? "Guardando..." : "Agregar"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Card para lista de choferes */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>
              <Truck size={18} className="mr-2" />
              Lista de Choferes
            </h3>
            <div className="choferes-count">{choferes.length} chofer(es)</div>
          </div>
          <div className="admin-card-content">
            {choferes.length > 0 ? (
              <div className="choferes-list">
                {choferes.map((chofer) => (
                  <div key={chofer.id} className="chofer-list-item">
                    {editingId === chofer.id ? (
                      <div className="chofer-edit-form">
                        <input
                          type="text"
                          className="edit-input"
                          value={editingNombre}
                          onChange={(e) => setEditingNombre(e.target.value)}
                          autoFocus
                        />
                        <div className="edit-actions">
                          <button
                            className="btn-action btn-save"
                            onClick={() => handleSaveEdit(chofer.id)}
                            title="Guardar"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            className="btn-action btn-cancel"
                            onClick={handleCancelEdit}
                            title="Cancelar"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="chofer-item-content">
                        <div className="chofer-nombre">
                          <Truck size={18} className="chofer-icon" />
                          <span>{chofer.nombre}</span>
                        </div>
                        <div className="chofer-actions">
                          <button
                            className="btn-action btn-edit"
                            onClick={() => handleEdit(chofer.id, chofer.nombre)}
                            title="Editar"
                            disabled={deleting}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="btn-action btn-delete"
                            onClick={() =>
                              handleDelete(chofer.id, chofer.nombre)
                            }
                            title="Eliminar"
                            disabled={deleting}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-choferes">
                <p>No hay choferes registrados</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChoferesAdministracion;
