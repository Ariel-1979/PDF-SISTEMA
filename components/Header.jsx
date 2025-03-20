"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import styles from "@/styles/Header.module.css";

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

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
        </nav>

        <div className={styles.headerActions}>
          {/* Icono de cerrar sesión independiente */}
          <button
            onClick={handleLogout}
            className={styles.logoutButton}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
