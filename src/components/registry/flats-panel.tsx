"use client"

import { motion } from "framer-motion"
import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { fadeRise, staggerContainer } from "@/lib/motion"
import type { Flat } from "@/types"

export const FlatsPanel = ({
  flats,
  onAdd
}: {
  flats: Flat[]
  onAdd: (input: { label: string; floor: number }) => Promise<void>
}) => {
  const [label, setLabel] = useState("")
  const [floor, setFloor] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!label.trim()) return
    setSaving(true)
    setError(null)
    try {
      await onAdd({ label: label.trim(), floor: Number(floor) || 0 })
      setLabel("")
      setFloor("")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not add the flat.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="border border-hairline bg-surface p-4 md:p-6">
      <h2 className="font-display text-xl">Flats</h2>
      <motion.ul variants={staggerContainer} initial="hidden" animate="visible" className="mt-4 space-y-2">
        {flats.map((flat) => (
          <motion.li
            key={flat.id}
            variants={fadeRise}
            className="flex items-center justify-between border border-hairline bg-surface-2 px-3 py-2 text-sm"
          >
            <span>{flat.label}</span>
            <span className="text-ink-faint">Floor {flat.floor}</span>
          </motion.li>
        ))}
      </motion.ul>
      <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block" htmlFor="flat-label">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Label</span>
          <input
            id="flat-label"
            required
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="12-C"
            className="mt-2 min-h-11 w-32 border border-hairline bg-surface-2 px-3 text-[16px]"
          />
        </label>
        <label className="block" htmlFor="flat-floor">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Floor</span>
          <input
            id="flat-floor"
            type="number"
            min={0}
            value={floor}
            onChange={(event) => setFloor(event.target.value)}
            className="mt-2 min-h-11 w-24 border border-hairline bg-surface-2 px-3 text-[16px]"
          />
        </label>
        <Button type="submit" disabled={saving}>
          {saving ? "Adding…" : "Add flat"}
        </Button>
      </form>
      {error ? (
        <p
          className="mt-4 border border-terracotta bg-terracotta-wash px-4 py-3 text-sm text-terracotta-deep"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </section>
  )
}
