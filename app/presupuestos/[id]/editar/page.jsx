import Header from "@/components/Header"
import PresupuestoEditForm from "@/components/PresupuestoEditForm"
import { getPresupuestoById } from "@/lib/db"

export default async function EditarPresupuestoPage({ params }) {
  // Convertir el ID a número para asegurarnos de que se usa correctamente
  const id = Number.parseInt(params.id, 10)
  console.log("EditarPresupuestoPage - ID recibido:", id)

  const presupuesto = await getPresupuestoById(id)
  console.log("EditarPresupuestoPage - ID del presupuesto cargado:", presupuesto?.id)

  return (
    <main>
      <Header />
      <PresupuestoEditForm presupuesto={presupuesto} />
    </main>
  )
}

