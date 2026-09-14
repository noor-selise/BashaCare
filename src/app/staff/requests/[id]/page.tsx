"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, type FormEvent } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { EvidenceStrip } from "@/components/requests/evidence-strip"
import { EvidenceUpload } from "@/components/requests/evidence-upload"
import { RequestContext } from "@/components/requests/request-context"
import { StatusRail } from "@/components/requests/status-rail"
import { AiPanel } from "@/components/triage/ai-panel"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { findPerson } from "@/data/directory"
import { formatWhen, statusLabel, urgencyLabel } from "@/lib/format"
import { formatTaka } from "@/lib/money"
import { useBuilding, useSessionActor } from "@/lib/store"
import type { Evidence } from "@/types"

const StaffRequestPage = () => {
  const { id } = useParams<{ id: string }>()
  const { requests, vendors, acknowledge, assignVendor, markDone, people } = useBuilding()
  const actor = useSessionActor()
  const toast = useToast()
  const request = requests.find((item) => item.id === id)
  const [afterEvidence, setAfterEvidence] = useState<Evidence | null>(null)
  const [cost, setCost] = useState("")

  const handleAssign = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const vendorId = new FormData(event.currentTarget).get("vendorId")
    if (typeof vendorId !== "string") return
    assignVendor(id, vendorId)
    const vendorName = vendors.find((item) => item.id === vendorId)?.name ?? "vendor"
    toast.success(`Assigned to ${vendorName}.`)
  }

  const handleDone = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const raw = new FormData(event.currentTarget).get("cost")
    let parsedCost: number | undefined
    if (raw !== null && String(raw).trim() !== "") {
      const value = Number(raw)
      if (Number.isFinite(value) && value >= 0) parsedCost = value
    }
    markDone(id, afterEvidence ?? undefined, parsedCost)
    toast.success("Marked done — waiting for resident to verify.")
  }

  const afterTone: Evidence["tone"] =
    request?.category === "lift"
      ? "lift"
      : request?.category === "water" || request?.category === "plumbing"
        ? "water"
        : "other"

  const canAssign =
    request &&
    request.status !== "verified_closed" &&
    request.status !== "rejected" &&
    request.status !== "awaiting_verification"

  const canMarkDone =
    request &&
    request.status !== "verified_closed" &&
    request.status !== "rejected" &&
    request.status !== "awaiting_verification"

  const awaitingVerify = request?.status === "awaiting_verification"
  const resident = request ? findPerson(request.residentId, people) : null

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
            <RequestContext request={request} people={people} />
            <StatusRail status={request.status} />
            <p className="font-bengali text-lg leading-relaxed">{request.message}</p>
            <EvidenceStrip items={request.evidence} />
            {request.cost != null ? (
              <p className="font-mono">{formatTaka(request.cost)}</p>
            ) : null}
            {request.status === "submitted" ? (
              <Button
                variant="danger"
                onClick={() => {
                  acknowledge(request.id)
                  toast.success("Request acknowledged.")
                }}
              >
                Acknowledge now
              </Button>
            ) : null}
            {awaitingVerify ? (
              <div className="space-y-3 border border-hairline bg-garden-wash p-4">
                <p className="text-ink">
                  Waiting for {resident?.name ?? "the resident"} to verify the work before this request
                  can close.
                </p>
                {actor?.role === "admin" ? (
                  <Link
                    href={`/resident/requests/${request.id}`}
                    className="inline-flex min-h-11 items-center text-courtyard underline-offset-4 hover:underline"
                  >
                    Open verify view (demo)
                  </Link>
                ) : null}
              </div>
            ) : null}
            {canAssign ? (
              <form onSubmit={handleAssign} className="flex flex-wrap gap-2">
                <label className="sr-only" htmlFor="vendorId">
                  Vendor
                </label>
                <select
                  id="vendorId"
                  name="vendorId"
                  className="min-h-11 border border-hairline bg-surface px-3 text-[16px]"
                  defaultValue={request.vendorId ?? vendors[0]?.id}
                >
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
                <Button type="submit">Assign</Button>
              </form>
            ) : null}
            {request.status === "verified_closed" ? (
              <p className="border border-hairline bg-surface-2 p-4 text-ink-soft">
                This request is verified closed.
              </p>
            ) : null}
            {canMarkDone ? (
              <form onSubmit={handleDone} className="grid gap-3 border border-hairline bg-surface p-4">
                <EvidenceUpload
                  requestId={request.id}
                  kind="after"
                  tone={afterTone}
                  buttonLabel="Attach after photo"
                  onUploaded={setAfterEvidence}
                />
                <label htmlFor="cost">
                  Cost (৳)
                  <input
                    id="cost"
                    name="cost"
                    type="number"
                    min={0}
                    value={cost}
                    onChange={(event) => setCost(event.target.value)}
                    className="mt-1 min-h-11 w-full border border-hairline px-3 text-[16px]"
                  />
                </label>
                <Button type="submit">Mark done — wait for verify</Button>
              </form>
            ) : null}
            <ol className="space-y-2 text-sm text-ink-soft">
              {request.timeline.map((event) => (
                <li key={event.id}>
                  {formatWhen(event.at)} · {findPerson(event.actorId, people).name}: {event.label}
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
