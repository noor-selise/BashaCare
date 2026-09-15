"use client"

import { AlertsTable } from "@/components/inbox/alerts-table"
import { AppShell } from "@/components/layout/app-shell"
import { EmptyState } from "@/components/ui/empty-state"
import { visibleNotices } from "@/lib/notices"
import { useBuilding, useSessionActor } from "@/lib/store"

const InboxPage = () => {
  const actor = useSessionActor()
  const { notices, requests, markNoticeRead } = useBuilding()
  const mine = actor
    ? visibleNotices(notices, { role: actor.role, id: actor.id, email: actor.email })
    : []

  return (
    <AppShell allow={["admin", "resident", "staff", "committee", "vendor"]}>
      <h1 className="font-display text-[32px] leading-tight">Alerts</h1>
      {mine.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Quiet" body="No alerts for this role." />
        </div>
      ) : actor ? (
        <AlertsTable
          notices={mine}
          requests={requests}
          role={actor.role}
          onMarkRead={markNoticeRead}
        />
      ) : null}
    </AppShell>
  )
}

export default InboxPage
