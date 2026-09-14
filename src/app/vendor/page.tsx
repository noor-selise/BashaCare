"use client"

import { BuildingRoster } from "@/components/building/building-roster"
import { AppShell } from "@/components/layout/app-shell"
import { RequestCard } from "@/components/requests/request-card"
import { RequestList } from "@/components/requests/request-list"
import { EmptyState } from "@/components/ui/empty-state"
import { uniqueFlatIds, visibleFlats } from "@/features/building/roster"
import { useBuilding, useSessionActor } from "@/lib/store"

const VendorHome = () => {
  const actor = useSessionActor()
  const { visibleRequests, flats, buildingInfo, session } = useBuilding()
  const jobs = visibleRequests()
  const roster = visibleFlats({
    role: session?.role ?? "vendor",
    actorFlatId: actor?.flatId,
    flats,
    assignedFlatIds: uniqueFlatIds(jobs)
  })

  return (
    <AppShell allow={["vendor"]}>
      <h1 className="font-display text-[32px] leading-tight">Assigned jobs</h1>
      <p className="mt-2 text-ink-soft">Only your work. No other vendors. No building finances.</p>
      {jobs.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No jobs" body="When Hasan assigns you, the brief appears here." />
        </div>
      ) : (
        <RequestList className="mt-6">
          {jobs.map((item) => (
            <RequestCard key={item.id} request={item} href={`/vendor/jobs/${item.id}`} />
          ))}
        </RequestList>
      )}
      <div className="mt-10">
        <BuildingRoster role={session?.role ?? "vendor"} buildingInfo={buildingInfo} flats={roster} />
      </div>
    </AppShell>
  )
}

export default VendorHome
