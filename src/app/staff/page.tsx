"use client"

import { AppShell } from "@/components/layout/app-shell"
import { RequestCard } from "@/components/requests/request-card"
import { EmptyState } from "@/components/ui/empty-state"
import { groupOpenBoard } from "@/features/requests/board"
import { useBuilding } from "@/lib/store"

const StaffBoard = () => {
  const { visibleRequests } = useBuilding()
  const { emergencies, urgent, routine } = groupOpenBoard(visibleRequests())

  return (
    <AppShell allow={["staff"]}>
      <h1 className="font-display text-[32px] leading-tight">Board</h1>
      <p className="mt-2 text-ink-soft">Emergencies first. Routine stays quiet.</p>
      <section className="mt-8">
        <h2 className="text-[11px] uppercase tracking-[0.08em] text-terracotta">Emergency</h2>
        <div className="mt-3 space-y-3">
          {emergencies.length === 0 ? (
            <EmptyState title="No emergencies" body="Keep it that way." />
          ) : (
            emergencies.map((item) => (
              <RequestCard key={item.id} request={item} href={`/staff/requests/${item.id}`} showMoney />
            ))
          )}
        </div>
      </section>
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Urgent</h2>
          <div className="mt-3 space-y-3">
            {urgent.map((item) => (
              <RequestCard key={item.id} request={item} href={`/staff/requests/${item.id}`} showMoney />
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Routine</h2>
          <div className="mt-3 space-y-3">
            {routine.map((item) => (
              <RequestCard key={item.id} request={item} href={`/staff/requests/${item.id}`} showMoney />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}

export default StaffBoard
