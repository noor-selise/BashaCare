"use client"

import { AppShell } from "@/components/layout/app-shell"
import { RequestCard } from "@/components/requests/request-card"
import { RequestList } from "@/components/requests/request-list"
import { EmptyState } from "@/components/ui/empty-state"
import { useBuilding } from "@/lib/store"

const VendorHome = () => {
  const { visibleRequests } = useBuilding()
  const jobs = visibleRequests()

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
    </AppShell>
  )
}

export default VendorHome
