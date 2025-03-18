"use client"

import { toast } from "sonner"

export function useToast() {
  return {
    showToast: (message, type = "default", duration = 3000) => {
      switch (type) {
        case "success":
          return toast.success(message, { duration })
        case "error":
          return toast.error(message, { duration })
        case "warning":
          return toast.warning(message, { duration })
        case "info":
          return toast.info(message, { duration })
        default:
          return toast(message, { duration })
      }
    },
  }
}

