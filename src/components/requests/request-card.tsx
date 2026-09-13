import Link from "next/link"
import { formatAge, statusLabel, urgencyLabel } from "@/lib/format"
import { formatTaka } from "@/lib/money"
import { cn } from "@/lib/cn"
import type { RequestRecord } from "@/types"

type RequestCardProps = {
  request: RequestRecord
  href: string
  showMoney?: boolean
}

export const RequestCard = ({ request, href, showMoney }: RequestCardProps) => {
  const emergency = request.urgency === "emergency" && request.status !== "verified_closed"

  return (
    <article
      className={cn(
        "rounded-[12px] border bg-surface p-4 transition-transform hover:-translate-y-0.5",
        emergency ? "border-terracotta bg-terracotta-wash" : "border-hairline"
      )}
    >
      <Link
        href={href}
        className="block rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-courtyard"
        aria-label={`${request.flatId} ${urgencyLabel(request.urgency)} ${statusLabel(request.status)}`}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-display text-lg">Flat {request.flatId}</p>
          <p className="text-[13px] text-ink-faint">{formatAge(request.createdAt)}</p>
        </div>
        <p className="mt-2 font-bengali leading-relaxed text-ink-soft line-clamp-2">
          {request.message}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-[12px] uppercase tracking-[0.08em]">
          <span className={cn("px-2 py-1", emergency ? "bg-terracotta text-surface" : "bg-warm")}>
            {urgencyLabel(request.urgency)}
          </span>
          <span className="bg-warm px-2 py-1">{statusLabel(request.status)}</span>
          {showMoney && request.cost != null ? (
            <span className="font-mono normal-case tracking-normal">{formatTaka(request.cost)}</span>
          ) : null}
        </div>
      </Link>
    </article>
  )
}
