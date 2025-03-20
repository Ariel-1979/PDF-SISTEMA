"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LogOut, User, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "@/styles/header.module.css";

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
    <header className={styles.header}>
      <div className={`container ${styles.headerContainer}`}>
        <h1 className={styles.logo}>
          <Link href="/dashboard">
            <img src="/Logo_Luongo.png" alt="Casa Luongo Logo" />
          </Link>
        </h1>

        {isClient && (
          <>
            <nav className={styles.mainNav}>
              <Link
                href="/dashboard"
                className={`${styles.navLink} ${
                  pathname === "/dashboard" ? styles.activeLink : ""
                }`}
              >
                Inicio
              </Link>
              <Link
                href="/presupuestos"
                className={`${styles.navLink} ${
                  pathname.startsWith("/presupuestos") ? styles.activeLink : ""
                }`}
              >
                Presupuestos
              </Link>
              <Link
                href="/pedidos"
                className={`${styles.navLink} ${
                  pathname.startsWith("/pedidos") ? styles.activeLink : ""
                }`}
              >
                Pedidos
              </Link>
              <Link
                href="/choferes"
                className={`${styles.navLink} ${
                  pathname.startsWith("/choferes") ? styles.activeLink : ""
                }`}
              >
                Choferes
              </Link>
              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className={`${styles.navLink} ${
                    pathname.startsWith("/admin") ? styles.activeLink : ""
                  }`}
                >
                  Admin
                </Link>
              )}
            </nav>

            <div className={styles.headerActions}>
              {/* Icono de cerrar sesión independiente */}
              {user && (
                <button
                  onClick={handleLogout}
                  className={styles.logoutButton}
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                >
                  <LogOut size={20} />
                </button>
              )}

              {user ? (
                <div className="relative">
                  <button
                    className={styles.userMenuButton}
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    <User size={18} />
                    <span className="hidden md:inline">{user.name}</span>
                  </button>

                  {showDropdown && (
                    <div className={styles.userDropdown}>
                      <div className={styles.userInfo}>
                        <div className={styles.userName}>{user.name}</div>
                        <div className={styles.userEmail}>{user.email}</div>
                        <div className={styles.userRole}>
                          {user.role === "admin" ? "Administrador" : "Usuario"}
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className={styles.dropdownItem}
                      >
                        <LogOut size={16} />
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" className={styles.userMenuButton}>
                  <LogIn size={18} />
                  <span className="hidden md:inline">Iniciar sesión</span>
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
