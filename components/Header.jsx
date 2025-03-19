"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LogOut, User, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Obtener información del usuario desde localStorage
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error al obtener usuario:", error);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      // Limpiar localStorage
      localStorage.removeItem("user");
      setUser(null);

      // Redireccionar a login
      router.push("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <header className="header">
      <div className="container header-container">
        <h1 className="logo">
          <Link href="/dashboard">
            <img src="/Logo_Luongo.png" alt="Casa Luongo Logo" />
          </Link>
        </h1>

        {isClient && (
          <>
            <nav className="main-nav">
              <Link
                href="/dashboard"
                className={`nav-link ${
                  pathname === "/dashboard" ? "active-link" : ""
                }`}
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
              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className={`nav-link ${
                    pathname.startsWith("/admin") ? "active-link" : ""
                  }`}
                >
                  Admin
                </Link>
              )}
            </nav>

            {user ? (
              <div className="relative">
                <button
                  className="user-menu-button flex items-center gap-2 px-3 py-2 rounded-full bg-primary-light text-primary hover:bg-primary hover:text-white transition-colors"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <User size={18} />
                  <span className="hidden md:inline">{user.name}</span>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-gray-500">{user.email}</div>
                      <div className="text-xs mt-1 bg-gray-100 rounded px-2 py-1 inline-block">
                        {user.role === "admin" ? "Administrador" : "Usuario"}
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary text-white hover:bg-primary-hover transition-colors"
              >
                <LogIn size={18} />
                <span className="hidden md:inline">Iniciar sesión</span>
              </Link>
            )}
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
