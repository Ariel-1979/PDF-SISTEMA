"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export default function DbUpdater() {
  const [updating, setUpdating] = useState(false)
  const [success, setSuccess] = useState(false)
  const { showToast } = useToast()

  const updateDatabase = async () => {
    try {
      setUpdating(true)

      // Ejecutar la actualización de la base de datos
      const response = await fetch("/api/db/update", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Error al actualizar la base de datos")
      }

      setSuccess(true)
      showToast("Base de datos actualizada correctamente", "success")
    } catch (error) {
      console.error("Error al actualizar la base de datos:", error)
      showToast(`Error al actualizar la base de datos: ${error.message}`, "error")
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="db-updater">
      <h2>Actualización de la Base de Datos</h2>
      <p>Este componente actualizará la estructura de la base de datos para incluir las columnas faltantes.</p>

      {success ? (
        <div className="success-message">
          <p>La base de datos se ha actualizado correctamente.</p>
        </div>
      ) : (
        <button className="btn btn-primary" onClick={updateDatabase} disabled={updating}>
          {updating ? "Actualizando..." : "Actualizar Base de Datos"}
        </button>
      )}
    </div>
  )
}

