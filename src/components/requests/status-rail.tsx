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
        return (
          <li
            key={step}
            className={cn(
              "border-t-2 pt-2 text-[13px]",
              done ? "border-courtyard text-ink" : "border-hairline text-ink-faint"
            )}
          >
            <span className="font-mono text-[11px]">{String(index + 1).padStart(2, "0")}</span>
            <div>{statusLabel(step)}</div>
          </li>
        )
      })}
    </ol>
  )
}
