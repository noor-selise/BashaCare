"use client"

import { AppShell } from "@/components/layout/app-shell"
import { CommitteeDesk } from "@/components/committee/desk"
import { vendors } from "@/data/seed"
import { useBuilding } from "@/lib/store"

const CommitteePage = () => {
  const { requests, decisions } = useBuilding()

  return (
    <AppShell allow={["committee"]}>
      <CommitteeDesk requests={requests} vendors={vendors} decisions={decisions} />
    </AppShell>
  )
}

export default CommitteePage
