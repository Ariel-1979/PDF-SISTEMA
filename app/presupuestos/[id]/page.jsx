import Header from "@/components/Header"
import PresupuestoDetail from "@/components/PresupuestoDetail"
import { getPresupuestoById } from "@/lib/db"

export default async function PresupuestoPage({ params }) {
  // Convertir el ID a número para asegurarnos de que se usa correctamente
  const id = Number.parseInt(params.id, 10)
  console.log("PresupuestoPage - ID recibido:", id)

  const presupuesto = await getPresupuestoById(id)
  console.log("PresupuestoPage - ID del presupuesto cargado:", presupuesto?.id)

  return (
    <main>
      <Header />
      <PresupuestoDetail presupuesto={presupuesto} />
    </main>
  )
}

