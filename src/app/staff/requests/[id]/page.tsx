"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import type { FormEvent } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { EvidenceStrip } from "@/components/requests/evidence-strip"
import { StatusRail } from "@/components/requests/status-rail"
import { AiPanel } from "@/components/triage/ai-panel"
import { Button } from "@/components/ui/button"
import { formatWhen, statusLabel, urgencyLabel } from "@/lib/format"
import { formatTaka } from "@/lib/money"
import { findActor, vendors } from "@/data/seed"
import { useBuilding } from "@/lib/store"

const StaffRequestPage = () => {
  const { id } = useParams<{ id: string }>()
  const { requests, acknowledge, assignVendor, markDone } = useBuilding()
  const request = requests.find((item) => item.id === id)

  const handleAssign = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const vendorId = new FormData(event.currentTarget).get("vendorId")
    if (typeof vendorId === "string") assignVendor(id, vendorId)
  }

  const handleDone = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const caption = String(data.get("after") || "After photo")
    const cost = Number(data.get("cost") || 0)
    markDone(id, caption, cost || undefined)
  }

  return (
    <AppShell allow={["staff"]}>
      {!request ? (
        <p>Request not found.</p>
      ) : (
        <article className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Link href="/staff" className="text-sm text-courtyard underline-offset-4 hover:underline">
              Back to board
            </Link>
            <header>
              <p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">
                {urgencyLabel(request.urgency)} · Flat {request.flatId} · {statusLabel(request.status)}
              </p>
              <h1 className="font-display text-[32px] leading-tight">Triage</h1>
            </header>
            <StatusRail status={request.status} />
            <p className="font-bengali text-lg leading-relaxed">{request.message}</p>
            <EvidenceStrip items={request.evidence} />
            {request.cost != null ? (
              <p className="font-mono">{formatTaka(request.cost)}</p>
            ) : null}
            {request.status === "submitted" ? (
              <Button variant="danger" onClick={() => acknowledge(request.id)}>
                Acknowledge now
              </Button>
            ) : null}
            <form onSubmit={handleAssign} className="flex flex-wrap gap-2">
              <label className="sr-only" htmlFor="vendorId">
                Vendor
              </label>
              <select
                id="vendorId"
                name="vendorId"
                className="min-h-11 border border-hairline bg-surface px-3 text-[16px]"
                defaultValue={request.vendorId ?? vendors[0].id}
              >
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
              <Button type="submit">Assign</Button>
            </form>
            <form onSubmit={handleDone} className="grid gap-2 border border-hairline bg-surface p-4">
              <label htmlFor="after">
                After photo caption
                <input
                  id="after"
                  name="after"
                  className="mt-1 min-h-11 w-full border border-hairline px-3 text-[16px]"
                  defaultValue="Work complete"
                />
              </label>
              <label htmlFor="cost">
                Cost (৳)
                <input
                  id="cost"
                  name="cost"
                  type="number"
                  min={0}
                  className="mt-1 min-h-11 w-full border border-hairline px-3 text-[16px]"
                />
              </label>
              <Button type="submit">Mark done — wait for verify</Button>
            </form>
            <ol className="space-y-2 text-sm text-ink-soft">
              {request.timeline.map((event) => (
                <li key={event.id}>
                  {formatWhen(event.at)} · {findActor(event.actorId).name}: {event.label}
                </li>
              ))}
            </ol>
          </div>
          <AiPanel request={request} />
        </article>
      )}
    </AppShell>
  )
}

export default StaffRequestPage
