import { X } from "lucide-react"
import { useToast } from "../../hooks/use-toast"
import { cn } from "../../lib/utils"

export function Toaster() {
    const { toasts, dismiss } = useToast()
    const visibleToasts = toasts.filter((toast) => toast.open !== false)

    return (
        <div className="fixed top-4 right-4 z-9999 flex w-full max-w-sm flex-col gap-3" role="status" aria-live="polite">
            {visibleToasts.map((toast) => {
                const { id, title, description, action, variant } = toast
                return (
                    <div
                        key={id}
                        className={cn(
                            "group relative flex items-start justify-between gap-3 rounded-lg border p-4 shadow-lg",
                            variant === "destructive"
                                ? "border-red-700 bg-red-600/10 text-red-100"
                                : "border-slate-700 bg-slate-900 text-slate-100"
                        )}
                    >
                        <div className="min-w-0 flex-1 space-y-1">
                            {title && <div className="font-semibold">{title}</div>}
                            {description && <div className="text-sm text-slate-300">{description}</div>}
                        </div>
                        {action}
                        <button
                            type="button"
                            onClick={() => dismiss(id)}
                            className="rounded-full p-1 text-slate-400 transition hover:text-slate-100"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )
            })}
        </div>
    )
}
