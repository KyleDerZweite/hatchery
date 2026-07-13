/* eslint-disable react-refresh/only-export-components -- the provider and its hook belong in one module; the cost is a full reload when this file changes. */
import { createContext, use, useCallback, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Toast {
  id: number
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

type ToastInput = Omit<Toast, 'id'>

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null)

const DISMISS_AFTER_MS = 6000

export function useToast() {
  const toast = use(ToastContext)
  if (!toast) throw new Error('useToast must be used inside <ToastProvider>')
  return { toast }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback(
    (input: ToastInput) => {
      const id = Date.now() + Math.random()
      setToasts((current) => [...current, { ...input, id }])
      setTimeout(() => dismiss(id), DISMISS_AFTER_MS)
    },
    [dismiss],
  )

  return (
    <ToastContext value={toast}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-0 right-0 z-100 flex w-full max-w-sm flex-col gap-2 p-4"
      >
        {toasts.map(({ id, title, description, variant }) => (
          <div
            key={id}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-fade-in-up',
              variant === 'destructive'
                ? 'border-destructive bg-destructive text-destructive-foreground'
                : 'border-border bg-card text-card-foreground',
            )}
          >
            <div className="grid gap-1">
              <p className="text-sm font-semibold">{title}</p>
              {description && <p className="text-sm opacity-90">{description}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(id)}
              aria-label={`Dismiss notification: ${title}`}
              className="ml-auto rounded-md p-1 opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  )
}
