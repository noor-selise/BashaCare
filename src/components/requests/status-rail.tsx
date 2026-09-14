import { motion } from "framer-motion"
import { statusOrder } from "@/features/requests/status"
import { statusLabel } from "@/lib/format"
import { cn } from "@/lib/cn"
import type { RequestStatus } from "@/types"

export const StatusRail = ({ status }: { status: RequestStatus }) => {
  const current = statusOrder.indexOf(status === "rejected" ? "submitted" : status)

  return (
    <ol className="grid grid-cols-2 gap-2 md:grid-cols-6" aria-label="Request status">
      {statusOrder.map((step, index) => {
        const done = index <= current && status !== "rejected"
        const isCurrent = index === current && status !== "rejected"
        return (
          <li key={step} className="relative pt-2 text-[13px]">
            {isCurrent ? (
              <motion.div
                layoutId="status-current"
                className="absolute inset-x-0 top-0 h-0.5 bg-courtyard"
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              />
            ) : (
              <div className={cn("absolute inset-x-0 top-0 h-0.5", done ? "bg-courtyard" : "bg-hairline")} />
            )}
            <span className={cn("font-mono text-[11px]", done ? "text-ink" : "text-ink-faint")}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className={done ? "text-ink" : "text-ink-faint"}>{statusLabel(step)}</div>
          </li>
        )
      })}
    </ol>
  )
}
