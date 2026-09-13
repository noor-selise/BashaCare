"use client"

import { AppShell } from "@/components/layout/app-shell"
import { CommitteeDesk } from "@/components/committee/desk"
import { useBuilding } from "@/lib/store"

const CommitteePage = () => {
  const { requests, decisions, vendors } = useBuilding()

  return (
    <AppShell allow={["committee"]}>
      <CommitteeDesk requests={requests} vendors={vendors} decisions={decisions} />
    </AppShell>
  )
}

export default CommitteePage
