"use client"

import { BuildingRoster } from "@/components/building/building-roster"
import { AppShell } from "@/components/layout/app-shell"
import { RequestCard } from "@/components/requests/request-card"
import { RequestList } from "@/components/requests/request-list"
import { EmptyState } from "@/components/ui/empty-state"
import { uniqueFlatIds, visibleFlats } from "@/features/building/roster"
import { groupOpenBoard } from "@/features/requests/board"
import { useBuilding, useSessionActor } from "@/lib/store"

const StaffBoard = () => {
  const actor = useSessionActor()
  const { visibleRequests, flats, buildingInfo, session } = useBuilding()
  const requests = visibleRequests()
  const { emergencies, urgent, routine } = groupOpenBoard(requests)
  const roster = visibleFlats({
    role: session?.role ?? "staff",
    actorFlatId: actor?.flatId,
    flats,
    assignedFlatIds: uniqueFlatIds(requests)
  })

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
      <div className="mt-10">
        <BuildingRoster role={session?.role ?? "staff"} buildingInfo={buildingInfo} flats={roster} />
      </div>
    </AppShell>
  )
}

export default StaffBoard
