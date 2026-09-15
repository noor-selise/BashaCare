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
import {
  canAcknowledge,
  canAssign,
  canConfirmDone,
  canStartWork,
  currentAssignValue,
  hasAfterPhoto,
  inHouseStaffPeople,
  needsNewAfterPhoto,
  parseAssignValue,
  type LifecycleActor
} from "@/features/requests/lifecycle"
import { formatWhen, statusLabel, urgencyLabel } from "@/lib/format"
import { formatTaka } from "@/lib/money"
import { useBuilding, useSessionActor } from "@/lib/store"
import type { Evidence } from "@/types"

const StaffRequestPage = () => {
  const { id } = useParams<{ id: string }>()
  const { requests, vendors, acknowledge, assignWork, startWork, markDone, people } = useBuilding()
  const actor = useSessionActor()
  const toast = useToast()
  const request = requests.find((item) => item.id === id)
  const [afterEvidence, setAfterEvidence] = useState<Evidence | null>(null)
  const [cost, setCost] = useState("")

  const ctx: LifecycleActor | null = actor
    ? { role: actor.role, actorId: actor.email || actor.id, vendorId: actor.vendorId }
    : null

  const staffPeople = inHouseStaffPeople(people)
  const fallbackAssign = vendors[0]
    ? { kind: "vendor" as const, vendorId: vendors[0].id }
    : staffPeople[0]
      ? { kind: "staff" as const, staffAssigneeId: staffPeople[0].email }
      : undefined

  const handleAssign = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const raw = new FormData(event.currentTarget).get("assignee")
    if (typeof raw !== "string") return
    const target = parseAssignValue(raw)
    if (!target) return
    assignWork(id, target)
    const label =
      target.kind === "vendor"
        ? (vendors.find((item) => item.id === target.vendorId)?.name ?? "vendor")
        : findPerson(target.staffAssigneeId, people).name
    toast.success(`Assigned to ${label}.`)
  }

  const handleDone = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!request || !hasAfterPhoto(request, afterEvidence ?? undefined)) {
      toast.error("Attach an after photo before confirming done.")
      return
    }
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

  const showAcknowledge = Boolean(ctx && request && canAcknowledge(request.status, ctx))
  const showAssign = Boolean(ctx && request && canAssign(request.status, ctx) && fallbackAssign)
  const showStart = Boolean(ctx && request && canStartWork(request.status, ctx, request))
  const showConfirm = Boolean(ctx && request && canConfirmDone(request.status, ctx, request))
  const awaitingVerify = request?.status === "awaiting_verification"
  const resident = request ? findPerson(request.residentId, people) : null
  const confirmReady = Boolean(request && hasAfterPhoto(request, afterEvidence ?? undefined))
  const sentBack = Boolean(request && needsNewAfterPhoto(request))

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
            {showAcknowledge ? (
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
            {showAssign ? (
              <form onSubmit={handleAssign} className="flex flex-wrap gap-2">
                <label className="sr-only" htmlFor="assignee">
                  Assign to vendor or in-house staff
                </label>
                <select
                  id="assignee"
                  name="assignee"
                  className="min-h-11 border border-hairline bg-surface px-3 text-[16px]"
                  defaultValue={currentAssignValue(request, fallbackAssign)}
                  key={currentAssignValue(request, fallbackAssign)}
                >
                  {vendors.length > 0 ? (
                    <optgroup label="Vendors">
                      {vendors.map((vendor) => (
                        <option key={vendor.id} value={`vendor:${vendor.id}`}>
                          {vendor.name}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                  {staffPeople.length > 0 ? (
                    <optgroup label="In-house staff">
                      {staffPeople.map((person) => (
                        <option key={person.email} value={`staff:${person.email}`}>
                          {person.name}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                </select>
                <Button type="submit">Assign</Button>
              </form>
            ) : null}
            {sentBack ? (
              <p className="border border-hairline bg-garden-wash p-4 text-ink">
                The resident said this work was not done. Continue the job and attach a new after
                photo before confirming again.
              </p>
            ) : null}
            {showStart ? (
              <Button
                onClick={() => {
                  startWork(request.id)
                  toast.success("Work started — status is In progress.")
                }}
              >
                Start work
              </Button>
            ) : null}
            {request.status === "verified_closed" ? (
              <p className="border border-hairline bg-surface-2 p-4 text-ink-soft">
                This request is verified closed.
              </p>
            ) : null}
            {showConfirm ? (
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
                <Button type="submit" disabled={!confirmReady}>
                  Confirm done — wait for verify
                </Button>
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
