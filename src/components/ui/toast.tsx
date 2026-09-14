"use client"

import { AnimatePresence, motion } from "framer-motion"
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react"
import { DURATION, EASE_STANDARD } from "@/lib/motion"
import { cn } from "@/lib/cn"

type ToastType = "success" | "error" | "info" | "warning" | "loading"

type ToastItem = {
  id: string
  type: ToastType
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

type ToastInput = {
  title: string
  description?: string
  type?: ToastType
  actionLabel?: string
  onAction?: () => void
  duration?: number
}

type ToastApi = {
  add: (input: ToastInput) => string
  close: (id: string) => void
  success: (title: string, description?: string) => string
  error: (title: string, description?: string) => string
  info: (title: string, description?: string) => string
  warning: (title: string, description?: string) => string
  promise: <T>(
    pending: Promise<T>,
    messages: {
      loading: string
      success: string | ((value: T) => string)
      error: string | ((error: unknown) => string)
    }
  ) => Promise<T>
}

const ToastContext = createContext<ToastApi | null>(null)

const DEFAULT_DURATION_MS = 4000

const toneClass: Record<ToastType, string> = {
  success: "border-garden bg-garden-wash text-garden",
  error: "border-terracotta bg-terracotta-wash text-terracotta-deep",
  info: "border-courtyard bg-courtyard-soft text-courtyard",
  warning: "border-warning bg-warning-wash text-warning",
  loading: "border-hairline bg-surface text-ink"
}

const STROKE = "1.75"

const ToastIcon = ({ type }: { type: ToastType }) => {
  if (type === "loading") {
    return (
      <motion.svg
        viewBox="0 0 20 20"
        fill="none"
        className="h-5 w-5 shrink-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, ease: "linear", repeat: Infinity }}
        aria-hidden="true"
      >
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth={STROKE} />
        <path
          d="M17.5 10a7.5 7.5 0 0 0-7.5-7.5"
          stroke="currentColor"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
      </motion.svg>
    )
  }
  if (type === "success") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 shrink-0" aria-hidden="true">
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth={STROKE} />
        <path
          d="M6.75 10.25 8.75 12.25 13.25 7.75"
          stroke="currentColor"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  if (type === "error") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 shrink-0" aria-hidden="true">
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth={STROKE} />
        <path d="M7.5 7.5 12.5 12.5M12.5 7.5 7.5 12.5" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      </svg>
    )
  }
  if (type === "warning") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 shrink-0" aria-hidden="true">
        <path d="M10 2.5 18 16.5H2L10 2.5Z" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
        <path d="M10 8v3.5" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
        <circle cx="10" cy="14" r="0.9" fill="currentColor" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 shrink-0" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth={STROKE} />
      <path d="M10 9v4.5" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      <circle cx="10" cy="6.5" r="0.9" fill="currentColor" />
    </svg>
  )
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Map<string, number>())

  const close = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const scheduleClose = useCallback(
    (id: string, duration: number) => {
      const timer = timers.current.get(id)
      if (timer) window.clearTimeout(timer)
      if (duration <= 0) return
      timers.current.set(
        id,
        window.setTimeout(() => close(id), duration)
      )
    },
    [close]
  )

  const add = useCallback(
    (input: ToastInput) => {
      nextId.current += 1
      const id = `toast-${nextId.current}`
      const type = input.type ?? "info"
      setItems((current) => [
        ...current,
        {
          id,
          type,
          title: input.title,
          description: input.description,
          actionLabel: input.actionLabel,
          onAction: input.onAction
        }
      ])
      scheduleClose(id, input.duration ?? (type === "loading" ? 0 : DEFAULT_DURATION_MS))
      return id
    },
    [scheduleClose]
  )

  const update = useCallback(
    (id: string, patch: Partial<ToastInput>) => {
      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                type: patch.type ?? item.type,
                title: patch.title ?? item.title,
                description: patch.description ?? item.description
              }
            : item
        )
      )
      scheduleClose(id, patch.duration ?? DEFAULT_DURATION_MS)
    },
    [scheduleClose]
  )

  const promise = useCallback(
    async <T,>(
      pending: Promise<T>,
      messages: {
        loading: string
        success: string | ((value: T) => string)
        error: string | ((error: unknown) => string)
      }
    ): Promise<T> => {
      const id = add({ title: messages.loading, type: "loading", duration: 0 })
      try {
        const value = await pending
        update(id, {
          type: "success",
          title: typeof messages.success === "function" ? messages.success(value) : messages.success
        })
        return value
      } catch (caught) {
        update(id, {
          type: "error",
          title: typeof messages.error === "function" ? messages.error(caught) : messages.error
        })
        throw caught
      }
    },
    [add, update]
  )

  const api: ToastApi = {
    add,
    close,
    success: (title, description) => add({ title, description, type: "success" }),
    error: (title, description) => add({ title, description, type: "error" }),
    info: (title, description) => add({ title, description, type: "info" }),
    warning: (title, description) => add({ title, description, type: "warning" }),
    promise
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
              role={item.type === "error" ? "alert" : "status"}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: DURATION.panel, ease: EASE_STANDARD }}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 border px-4 py-3 text-sm shadow-[var(--shadow-lg)]",
                toneClass[item.type]
              )}
            >
              <ToastIcon type={item.type} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.title}</p>
                {item.description ? <p className="mt-1 text-ink-soft">{item.description}</p> : null}
                {item.actionLabel && item.onAction ? (
                  <button
                    type="button"
                    onClick={() => {
                      item.onAction?.()
                      close(item.id)
                    }}
                    className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] underline underline-offset-4"
                  >
                    {item.actionLabel}
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => close(item.id)}
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
