"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/Header";

export default function ClientHeader() {
  return (
    <AuthProvider>
      <Header />
    </AuthProvider>
  );
}
