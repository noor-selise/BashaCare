"use client"

import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { EmptyState } from "@/components/ui/empty-state"
import { formatWhen } from "@/lib/format"
import { inboxLink } from "@/lib/notices"
import { isUnreadNotice } from "@/lib/request-highlight"
import { cn } from "@/lib/cn"
import { roleHome } from "@/lib/session/role-home"
import { useBuilding, useSessionActor } from "@/lib/store"

const InboxPage = () => {
  const actor = useSessionActor()
  const { notices, requests, markNoticeRead } = useBuilding()
  const mine = notices.filter((item) => {
    if (!actor) return false
    if (actor.role === "admin") return true
    return item.role === "all" || item.role === actor.role
  })

  return (
    <AppShell allow={["admin", "resident", "staff", "committee", "vendor"]}>
      <h1 className="font-display text-[32px] leading-tight">Alerts</h1>
      <div className="mt-6 space-y-3">
        {mine.length === 0 ? (
          <EmptyState title="Quiet" body="No alerts for this role." />
        ) : (
          mine.map((item) => {
            const request = item.requestId
              ? requests.find((row) => row.id === item.requestId)
              : undefined
            const link =
              actor && item.requestId
                ? inboxLink(item, request, actor.role)
                : { href: roleHome(actor?.role ?? "resident"), label: "Home" }

            const unread = isUnreadNotice(item)

            return (
              <article
                key={item.id}
                className={cn(
                  "border p-4",
                  unread
                    ? "border-l-4 border-l-courtyard border-hairline bg-courtyard-soft"
                    : "border-hairline bg-surface"
                )}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[13px] text-ink-faint">{formatWhen(item.at)}</p>
                  {unread ? (
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-courtyard">
                      New
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-1 font-display text-xl">{item.title}</h2>
                <p className="mt-2 text-ink-soft">{item.body}</p>
                <div className="mt-3 flex gap-3">
                  <Link
                    href={link.href}
                    className="text-courtyard underline-offset-4 hover:underline"
                    onClick={() => markNoticeRead(item.id)}
                  >
                    {link.label}
                  </Link>
                </div>
              </article>
            )
          })
        )}
      </div>
    </AppShell>
  )
}

export default InboxPage
