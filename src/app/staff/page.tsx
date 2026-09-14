"use client"

import { AppShell } from "@/components/layout/app-shell"
import { RequestCard } from "@/components/requests/request-card"
import { RequestList } from "@/components/requests/request-list"
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
        {emergencies.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="No emergencies" body="Keep it that way." />
          </div>
        ) : (
          <RequestList className="mt-3">
            {emergencies.map((item) => (
              <RequestCard key={item.id} request={item} href={`/staff/requests/${item.id}`} showMoney />
            ))}
          </RequestList>
        )}
      </section>
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Urgent</h2>
          <RequestList className="mt-3">
            {urgent.map((item) => (
              <RequestCard key={item.id} request={item} href={`/staff/requests/${item.id}`} showMoney />
            ))}
          </RequestList>
        </section>
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Routine</h2>
          <RequestList className="mt-3">
            {routine.map((item) => (
              <RequestCard key={item.id} request={item} href={`/staff/requests/${item.id}`} showMoney />
            ))}
          </RequestList>
        </section>
      </div>
    </AppShell>
  )
}

export default StaffBoard
