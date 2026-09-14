"use client"

import { motion } from "framer-motion"
import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { fadeRise } from "@/lib/motion"
import type { BuildingInfo } from "@/types"

export const BuildingPanel = ({
  buildingInfo,
  onSave
}: {
  buildingInfo: BuildingInfo | null
  onSave: (input: Omit<BuildingInfo, "id">) => Promise<void>
}) => {
  const toast = useToast()
  const [name, setName] = useState(buildingInfo?.name ?? "")
  const [addressLine, setAddressLine] = useState(buildingInfo?.addressLine ?? "")
  const [storeys, setStoreys] = useState(String(buildingInfo?.storeys ?? ""))
  const [flatCount, setFlatCount] = useState(String(buildingInfo?.flatCount ?? ""))
  const [fee, setFee] = useState(String(buildingInfo?.fee ?? ""))
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      await toast.promise(
        onSave({
          name,
          addressLine,
          storeys: Number(storeys) || 0,
          flatCount: Number(flatCount) || 0,
          fee: Number(fee) || 0
        }),
        {
          loading: "Saving building…",
          success: "Building details saved.",
          error: (caught) => (caught instanceof Error ? caught.message : "Could not save the building.")
        }
      )
    } catch {
      // toast.promise already reported the error
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.form
      onSubmit={(event) => void handleSubmit(event)}
      initial="hidden"
      animate="visible"
      variants={fadeRise}
      className="space-y-4 border border-hairline bg-surface p-4 md:p-6"
    >
      <h2 className="font-display text-xl">Building</h2>
      <label className="block" htmlFor="building-name">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Name</span>
        <input
          id="building-name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 min-h-11 w-full border border-hairline bg-surface-2 px-3 text-[16px]"
        />
      </label>
      <label className="block" htmlFor="building-address">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Address</span>
        <input
          id="building-address"
          required
          value={addressLine}
          onChange={(event) => setAddressLine(event.target.value)}
          className="mt-2 min-h-11 w-full border border-hairline bg-surface-2 px-3 text-[16px]"
        />
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="block" htmlFor="building-storeys">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Storeys</span>
          <input
            id="building-storeys"
            type="number"
            min={0}
            value={storeys}
            onChange={(event) => setStoreys(event.target.value)}
            className="mt-2 min-h-11 w-full border border-hairline bg-surface-2 px-3 text-[16px]"
          />
        </label>
        <label className="block" htmlFor="building-flat-count">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Flat count</span>
          <input
            id="building-flat-count"
            type="number"
            min={0}
            value={flatCount}
            onChange={(event) => setFlatCount(event.target.value)}
            className="mt-2 min-h-11 w-full border border-hairline bg-surface-2 px-3 text-[16px]"
          />
        </label>
        <label className="block" htmlFor="building-fee">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Fee (৳)</span>
          <input
            id="building-fee"
            type="number"
            min={0}
            value={fee}
            onChange={(event) => setFee(event.target.value)}
            className="mt-2 min-h-11 w-full border border-hairline bg-surface-2 px-3 text-[16px]"
          />
        </label>
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save building"}
      </Button>
    </motion.form>
  )
}
