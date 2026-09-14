"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import type { Vendor } from "@/types"

export const VendorsPanel = ({
  vendors,
  onAdd
}: {
  vendors: Vendor[]
  onAdd: (input: { name: string; trade: string }) => Promise<void>
}) => {
  const [name, setName] = useState("")
  const [trade, setTrade] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim() || !trade.trim()) return
    setSaving(true)
    setError(null)
    try {
      await onAdd({ name: name.trim(), trade: trade.trim() })
      setName("")
      setTrade("")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not add the vendor.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="border border-hairline bg-surface p-4 md:p-6">
      <h2 className="font-display text-xl">Vendors</h2>
      <ul className="mt-4 space-y-2">
        {vendors.map((vendor) => (
          <li key={vendor.id} className="flex items-center justify-between border border-hairline bg-surface-2 px-3 py-2 text-sm">
            <span>{vendor.name}</span>
            <span className="text-ink-faint">{vendor.trade}</span>
          </li>
        ))}
      </ul>
      <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block w-full sm:w-48" htmlFor="vendor-name">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Name</span>
          <input
            id="vendor-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 min-h-11 w-full border border-hairline bg-surface-2 px-3 text-[16px]"
          />
        </label>
        <label className="block w-full sm:w-40" htmlFor="vendor-trade">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Trade</span>
          <input
            id="vendor-trade"
            required
            value={trade}
            onChange={(event) => setTrade(event.target.value)}
            placeholder="Electrical"
            className="mt-2 min-h-11 w-full border border-hairline bg-surface-2 px-3 text-[16px]"
          />
        </label>
        <Button type="submit" disabled={saving}>
          {saving ? "Adding…" : "Add vendor"}
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
