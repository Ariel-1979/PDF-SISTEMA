import Header from "@/components/Header";
import PedidoDetail from "@/components/PedidoDetail";
import { getPedidoById } from "@/lib/db";
import { parse } from "path";

export default async function PedidoPage({ params }) {
  // Convertir el ID a número para asegurarnos de que se usa correctamente
  const { id } = await params;

  const pedido = await getPedidoById(parseInt(id, 10));

  return (
    <main>
      <Header />
      <PedidoDetail pedido={pedido} />
    </main>
  );
}
