import { Inter } from "next/font/google";
import "@/styles/globals.css";
import "./globals.css";
import { SonnerToastProvider } from "@/components/ui/sonner-toast-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Casa Luongo",
  description: "Sistema de gestión de presupuestos y pedidos para Casa Luongo",
  generator: "Ariel Dominguez - Web Designer",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
        <SonnerToastProvider />
      </body>
    </html>
  );
}
