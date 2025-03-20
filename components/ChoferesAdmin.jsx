"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, Save, X, Truck, User } from "lucide-react";
import Link from "next/link";
import "@/styles/choferes.css";

const ChoferesAdmin = () => {
  const [choferes, setChoferes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingNombre, setEditingNombre] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    fetchChoferes();
  }, []);

  const fetchChoferes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/choferes-nuevo/lista");
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

      const response = await fetch("/api/choferes-nuevo/crear", {
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
      const response = await fetch("/api/choferes-nuevo/editar", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, nombre: editingNombre }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el chofer");
      }

      showToast("Chofer actualizado correctamente", "success");
      setEditingId(null);
      fetchChoferes();
    } catch (error) {
      console.error("Error al actualizar chofer:", error);
      showToast(`Error al actualizar el chofer: ${error.message}`, "error");
    }
  };

  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Está seguro que desea eliminar al chofer ${nombre}?`)) {
      return;
    }

    try {
      const response = await fetch("/api/choferes-nuevo/eliminar", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el chofer");
      }

      showToast("Chofer eliminado correctamente", "success");
      fetchChoferes();
    } catch (error) {
      console.error("Error al eliminar chofer:", error);
      showToast(`Error al eliminar el chofer: ${error.message}`, "error");
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
          <Link href="/choferes/pedidos" className="btn btn-primary">
            <Truck size={18} className="mr-2" />
            Ver Pedidos por Chofer
          </Link>
        </div>
      </div>

      {/* Formulario compacto para agregar choferes */}
      <div className="chofer-form-compact">
        <form onSubmit={handleSubmit} className="chofer-form">
          <div className="chofer-input-container">
            <div className="chofer-input-wrapper">
              <User size={18} className="chofer-input-icon" />
              <input
                type="text"
                className="chofer-input"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ingrese el nombre del chofer"
              />
            </div>
            <button
              type="submit"
              className="btn-agregar-chofer"
              disabled={saving}
            >
              <PlusCircle size={18} />
              <span>{saving ? "Guardando..." : "Agregar"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Lista de choferes simplificada - sin ID ni fecha */}
      <div className="choferes-list-container">
        <div className="choferes-list-header">
          <h3>Lista de Choferes</h3>
          <div className="choferes-count">{choferes.length} chofer(es)</div>
        </div>

        {choferes.length > 0 ? (
          <div className="choferes-table-container">
            <table className="choferes-table">
              <thead>
                <tr>
                  <th className="column-nombre">Nombre</th>
                  <th className="column-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {choferes.map((chofer) => (
                  <tr key={chofer.id}>
                    <td className="column-nombre">
                      {editingId === chofer.id ? (
                        <input
                          type="text"
                          className="edit-input"
                          value={editingNombre}
                          onChange={(e) => setEditingNombre(e.target.value)}
                        />
                      ) : (
                        <div className="chofer-nombre">
                          <Truck size={18} className="chofer-icon" />
                          <span>{chofer.nombre}</span>
                        </div>
                      )}
                    </td>
                    <td className="column-acciones">
                      <div className="table-actions">
                        {editingId === chofer.id ? (
                          <>
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
                          </>
                        ) : (
                          <>
                            <button
                              className="btn-action btn-edit"
                              onClick={() =>
                                handleEdit(chofer.id, chofer.nombre)
                              }
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              className="btn-action btn-delete"
                              onClick={() =>
                                handleDelete(chofer.id, chofer.nombre)
                              }
                              title="Eliminar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-choferes">
            <p>No hay choferes registrados</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChoferesAdmin;
