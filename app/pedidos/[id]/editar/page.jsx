import Header from "@/components/Header";
import PedidoEditForm from "@/components/PedidoEditForm";
import { getPedidoById } from "@/lib/db";

export default async function EditarPedidoPage({ params }) {
  // Convertir el ID a número para asegurarnos de que se usa correctamente
  const id = Number.parseInt(params.id, 10);

  const pedido = await getPedidoById(id);

  return (
    <main>
      <Header />
      <PedidoEditForm pedido={pedido} />
    </main>
  );
}
