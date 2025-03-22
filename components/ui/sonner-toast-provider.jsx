"use client";

import { Toaster } from "sonner";

export function SonnerToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          background: "var(--bg-light)",
          color: "var(--text-color)",
          border: "1px solid var(--border-color)",
          padding: "1.5rem",
          borderRadius: "1rem",
        },
      }}
    />
  );
}
