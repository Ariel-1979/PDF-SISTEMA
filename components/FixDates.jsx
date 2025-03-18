"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export default function FixDates() {
  const [fixing, setFixing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [result, setResult] = useState(null)
  const { showToast } = useToast()

  const fixDates = async () => {
    try {
      setFixing(true)

      // Ejecutar la corrección de fechas
      const response = await fetch("/api/db/fix-dates", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Error al corregir las fechas")
      }

      const data = await response.json()
      setResult(data)
      setSuccess(true)
      showToast(`Fechas corregidas correctamente. ${data.pedidosCorregidos} pedidos actualizados.`, "success")
    } catch (error) {
      console.error("Error al corregir fechas:", error)
      showToast(`Error al corregir las fechas: ${error.message}`, "error")
    } finally {
      setFixing(false)
    }
  }

  return (
    <div className="db-updater">
      <h2>Corrección de Fechas</h2>
      <p>Este componente corregirá las fechas de entrega que tengan años incorrectos (futuros).</p>

      {success ? (
        <div className="success-message">
          <p>Las fechas se han corregido correctamente.</p>
          {result && <p>Se corrigieron {result.pedidosCorregidos} pedidos con fechas incorrectas.</p>}
        </div>
      ) : (
        <button className="btn btn-primary" onClick={fixDates} disabled={fixing}>
          {fixing ? "Corrigiendo..." : "Corregir Fechas"}
        </button>
      )}
    </div>
  )
}

