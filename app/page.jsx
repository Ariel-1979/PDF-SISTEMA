import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <img src="/Logo_Luongo.png" alt="Casa Luongo Logo" className="mx-auto mb-6" width={150} height={80} />
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Sistema de Gestión Casa Luongo</h1>
        <p className="text-gray-600 mb-8">Bienvenido al sistema de gestión de presupuestos y pedidos</p>

        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary-hover transition-colors"
          >
            Iniciar Sesión
          </Link>

          <div className="text-sm text-gray-500 mt-4">Sistema desarrollado para Casa Luongo</div>
        </div>
      </div>
    </div>
  )
}

