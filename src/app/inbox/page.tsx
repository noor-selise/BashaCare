"use client"

import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { EmptyState } from "@/components/ui/empty-state"
import { formatWhen } from "@/lib/format"
import { roleHome } from "@/lib/session/role-home"
import { useBuilding, useSessionActor } from "@/lib/store"

const InboxPage = () => {
  const actor = useSessionActor()
  const { notices, markNoticeRead } = useBuilding()
  const mine = notices.filter((item) => item.role === "all" || item.role === actor?.role)

  return (
    <AppShell allow={["resident", "staff", "committee", "vendor"]}>
      <h1 className="font-display text-[32px] leading-tight">Alerts</h1>
      <div className="mt-6 space-y-3">
        {mine.length === 0 ? (
          <EmptyState title="Quiet" body="No alerts for this role." />
        ) : (
          mine.map((item) => (
            <article key={item.id} className="border border-hairline bg-surface p-4">
              <p className="text-[13px] text-ink-faint">{formatWhen(item.at)}</p>
              <h2 className="mt-1 font-display text-xl">{item.title}</h2>
              <p className="mt-2 text-ink-soft">{item.body}</p>
              <div className="mt-3 flex gap-3">
                {item.requestId && actor ? (
                  <Link
                    href={
                      actor.role === "resident"
                        ? `/resident/requests/${item.requestId}`
                        : actor.role === "vendor"
                          ? `/vendor/jobs/${item.requestId}`
                          : actor.role === "committee"
                            ? "/committee"
                            : `/staff/requests/${item.requestId}`
                    }
                    className="text-courtyard underline-offset-4 hover:underline"
                    onClick={() => markNoticeRead(item.id)}
                  >
                    Open
                  </Link>
                ) : (
                  <Link href={roleHome(actor?.role ?? "resident")}>Home</Link>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </AppShell>
  )
}

export default InboxPage
