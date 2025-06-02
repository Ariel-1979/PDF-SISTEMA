import Header from "@/components/Header";
import PresupuestoDetail from "@/components/PresupuestoDetail";
import { getPresupuestoById } from "@/lib/db";

export default async function PresupuestoPage({ params }) {
  // Convertir el ID a número para asegurarnos de que se usa correctamente
  const { id } = await params;
  const presupuesto = await getPresupuestoById(parseInt(id, 10));
  return (
    <main>
      <Header />
      <PresupuestoDetail presupuesto={presupuesto} />
    </main>
  );
}
