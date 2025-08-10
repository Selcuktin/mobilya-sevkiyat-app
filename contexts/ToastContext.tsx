'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { ToastContainer, ToastProps } from '../components/ui/Toast'

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id'>) => void
  showSuccess: (title: string, message?: string) => void
  showError: (title: string, message?: string) => void
  showWarning: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const showToast = (toast: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
  }

  const showSuccess = (title: string, message?: string) => {
    showToast({ type: 'success', title, message })
  }

  const showError = (title: string, message?: string) => {
    showToast({ type: 'error', title, message })
  }

  const showWarning = (title: string, message?: string) => {
    showToast({ type: 'warning', title, message })
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}