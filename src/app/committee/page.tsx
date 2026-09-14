"use client"

import { AppShell } from "@/components/layout/app-shell"
import { CommitteeDesk } from "@/components/committee/desk"
import { uniqueFlatIds, visibleFlats } from "@/features/building/roster"
import { useBuilding } from "@/lib/store"

const CommitteePage = () => {
  const { requests, decisions, vendors, flats, buildingInfo, session } = useBuilding()
  const role = session?.role ?? "committee"
  const roster = visibleFlats({
    role,
    flats,
    assignedFlatIds: uniqueFlatIds(requests)
  })

  return (
    <AppShell allow={["committee"]}>
      <CommitteeDesk
        requests={requests}
        vendors={vendors}
        decisions={decisions}
        flats={roster}
        buildingInfo={buildingInfo}
        role={role}
      />
    </AppShell>
  )
}

export default CommitteePage
