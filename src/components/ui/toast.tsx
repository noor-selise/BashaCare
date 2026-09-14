"use client"

import { AnimatePresence, motion } from "framer-motion"
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react"
import { DURATION, EASE_STANDARD } from "@/lib/motion"
import { cn } from "@/lib/cn"

type ToastTone = "success" | "error" | "info"

type ToastItem = {
  id: string
  tone: ToastTone
  message: string
}

type ToastApi = {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const toneClass: Record<ToastTone, string> = {
  success: "border-garden bg-garden-wash text-garden",
  error: "border-terracotta bg-terracotta-wash text-terracotta-deep",
  info: "border-hairline bg-surface text-ink"
}

const TOAST_DURATION_MS = 4000

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const push = useCallback(
    (tone: ToastTone, message: string) => {
      nextId.current += 1
      const id = `toast-${nextId.current}`
      setItems((current) => [...current, { id, tone, message }])
      window.setTimeout(() => dismiss(id), TOAST_DURATION_MS)
    },
    [dismiss]
  )

  const api: ToastApi = {
    success: (message) => push("success", message),
    error: (message) => push("error", message),
    info: (message) => push("info", message)
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end"
      >
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              role={item.tone === "error" ? "alert" : "status"}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: DURATION.panel, ease: EASE_STANDARD }}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start justify-between gap-3 border px-4 py-3 text-sm shadow-[var(--shadow-lg)]",
                toneClass[item.tone]
              )}
            >
              <p>{item.message}</p>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
                className="shrink-0 text-xs uppercase tracking-[0.08em] opacity-70 hover:opacity-100"
              >
                Close
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider")
  }
  return context
}
