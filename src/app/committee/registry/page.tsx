"use client"

import { AppShell } from "@/components/layout/app-shell"
import { BuildingPanel } from "@/components/registry/building-panel"
import { FlatsPanel } from "@/components/registry/flats-panel"
import { useBuilding } from "@/lib/store"

const RegistryPage = () => {
  const { buildingInfo, flats, updateBuildingInfo, addFlat } = useBuilding()

  return (
    <AppShell allow={["committee"]}>
      <h1 className="font-display text-[32px] leading-tight">Registry</h1>
      <p className="mt-2 text-ink-soft">Register flats, invite people, and keep building details current.</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <BuildingPanel buildingInfo={buildingInfo} onSave={updateBuildingInfo} />
        <FlatsPanel flats={flats} onAdd={addFlat} />
      </div>
    </AppShell>
  )
}

export default RegistryPage
