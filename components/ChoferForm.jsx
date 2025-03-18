"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { PlusCircle } from "lucide-react"

export default function ChoferForm({ onChoferAdded }) {
  const [nombre, setNombre] = useState("")
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!nombre.trim()) {
      showToast("Debe ingresar un nombre para el chofer", "error")
      return
    }

    try {
      setSaving(true)

      const response = await fetch("/api/choferes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombre }),
      })

      if (!response.ok) {
        throw new Error("Error al guardar el chofer")
      }

      showToast(`Chofer ${nombre} agregado correctamente`, "success")
      setNombre("")

      // Llamar a la función para actualizar la lista de choferes
      if (typeof onChoferAdded === "function") {
        onChoferAdded()
      }
    } catch (error) {
      console.error("Error al agregar chofer:", error)
      showToast(`Error al agregar el chofer: ${error.message}`, "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="chofer-form-container">
      <h3>Agregar Nuevo Chofer</h3>
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
            <button type="submit" className="btn btn-primary btn-icon" disabled={saving}>
              <PlusCircle size={20} />
              <span>{saving ? "Guardando..." : "Agregar"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

