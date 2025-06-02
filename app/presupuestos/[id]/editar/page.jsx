import Header from "@/components/Header";
import PresupuestoEditForm from "@/components/PresupuestoEditForm";
import { getPresupuestoById } from "@/lib/db";

export default async function EditarPresupuestoPage({ params }) {
  const { id } = await params;

  const presupuesto = await getPresupuestoById(parseInt(id, 10));

  return (
    <main>
      <Header />
      <PresupuestoEditForm presupuesto={presupuesto} />
    </main>
  );
}
