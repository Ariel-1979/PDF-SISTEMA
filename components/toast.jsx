"use client"

import { useEffect, useState } from "react"

export const Toast = ({ message, type = "success", duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      if (onClose) setTimeout(onClose, 300) // Dar tiempo para la animación de salida
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-500"
      case "error":
        return "bg-red-500"
      case "warning":
        return "bg-yellow-500"
      case "info":
        return "bg-blue-500"
      default:
        return "bg-gray-700"
    }
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-md text-white shadow-lg transition-all duration-300 ${getTypeStyles()} ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
    >
      {message}
    </div>
  )
}

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([])

  // Exponer la función para agregar toasts globalmente
  useEffect(() => {
    window.showToast = (message, type = "success", duration = 3000) => {
      const id = Date.now()
      setToasts((prev) => [...prev, { id, message, type, duration }])
      return id
    }

    window.removeToast = (id) => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }

    return () => {
      window.showToast = undefined
      window.removeToast = undefined
    }
  }, [])

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => window.removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

// Hook para usar el toast en componentes
export const useToast = () => {
  const showToast = (message, type = "success", duration = 3000) => {
    if (typeof window !== "undefined" && window.showToast) {
      return window.showToast(message, type, duration)
    }
    return null
  }

  const removeToast = (id) => {
    if (typeof window !== "undefined" && window.removeToast) {
      window.removeToast(id)
    }
  }

  return { showToast, removeToast }
}

