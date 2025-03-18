import Header from "@/components/Header"
import PedidoDetail from "@/components/PedidoDetail"
import { getPedidoById } from "@/lib/db"

export default async function PedidoPage({ params }) {
  // Convertir el ID a número para asegurarnos de que se usa correctamente
  const id = Number.parseInt(params.id, 10)
  console.log("PedidoPage - ID recibido:", id)

  const pedido = await getPedidoById(id)
  console.log("PedidoPage - ID del pedido cargado:", pedido?.id)

  return (
    <main>
      <Header />
      <PedidoDetail pedido={pedido} />
    </main>
  )
}

