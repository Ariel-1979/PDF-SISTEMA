"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const Header = () => {
  const pathname = usePathname();

  return (
    <header className="header">
      <div className="container header-container">
        <h1 className="logo">
          <Link href="/">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo_Luongo-2yJWkbBhykRbk43ImjzWGhnPvuw3uR.png"
              alt="Casa Luongo Logo"
            />
            Casa Luongo
          </Link>
        </h1>
        <nav className="main-nav">
          <Link
            href="/"
            className={`nav-link ${pathname === "/" ? "active-link" : ""}`}
          >
            Inicio
          </Link>
          <Link
            href="/presupuestos"
            className={`nav-link ${
              pathname.startsWith("/presupuestos") ? "active-link" : ""
            }`}
          >
            Presupuestos
          </Link>
          <Link
            href="/pedidos"
            className={`nav-link ${
              pathname.startsWith("/pedidos") ? "active-link" : ""
            }`}
          >
            Pedidos
          </Link>
          <Link
            href="/choferes"
            className={`nav-link ${
              pathname.startsWith("/choferes") ? "active-link" : ""
            }`}
          >
            Choferes
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
