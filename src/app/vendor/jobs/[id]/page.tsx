"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { EvidenceStrip } from "@/components/requests/evidence-strip"
import { EvidenceUpload } from "@/components/requests/evidence-upload"
import { RequestContext } from "@/components/requests/request-context"
import { StatusRail } from "@/components/requests/status-rail"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import {
  canConfirmDone,
  canStartWork,
  hasAfterPhoto,
  needsNewAfterPhoto,
  type LifecycleActor
} from "@/features/requests/lifecycle"
import { useBuilding, useSessionActor } from "@/lib/store"
import type { Evidence } from "@/types"

const VendorJobPage = () => {
  const { id } = useParams<{ id: string }>()
  const { visibleRequests, startWork, markDone, people } = useBuilding()
  const actor = useSessionActor()
  const toast = useToast()
  const job = visibleRequests().find((item) => item.id === id)
  const [afterEvidence, setAfterEvidence] = useState<Evidence | null>(null)

  const ctx: LifecycleActor | null = actor
    ? { role: actor.role, actorId: actor.email || actor.id, vendorId: actor.vendorId }
    : null

  const handleDone = () => {
    if (!job || !hasAfterPhoto(job, afterEvidence ?? undefined)) {
      toast.error("Attach an after photo before confirming done.")
      return
    }
    markDone(job.id, afterEvidence ?? undefined)
    toast.success("Marked done — waiting for resident to verify.")
  }

  const afterTone: Evidence["tone"] =
    job?.category === "lift"
      ? "lift"
      : job?.category === "water" || job?.category === "plumbing"
        ? "water"
        : "other"

  const showStart = Boolean(ctx && job && canStartWork(job.status, ctx, job))
  const showConfirm = Boolean(ctx && job && canConfirmDone(job.status, ctx, job))
  const confirmReady = Boolean(job && hasAfterPhoto(job, afterEvidence ?? undefined))
  const sentBack = Boolean(job && needsNewAfterPhoto(job))

  return (
    <AppShell allow={["vendor"]}>
      {!job ? (
        <p>This job is not assigned to you.</p>
      ) : (
        <article className="space-y-6">
          <Link href="/vendor" className="text-sm text-courtyard underline-offset-4 hover:underline">
            Back to jobs
          </Link>
          <h1 className="font-display text-[32px] leading-tight">Flat {job.flatId}</h1>
          <RequestContext request={job} people={people} />
          <StatusRail status={job.status} />
          <p className="font-bengali text-lg">{job.message}</p>
          <EvidenceStrip items={job.evidence} />
          {sentBack ? (
            <p className="border border-hairline bg-garden-wash p-4 text-ink">
              The resident said this work was not done. Continue the job and attach a new after
              photo before confirming again.
            </p>
          ) : null}
          {showStart ? (
            <Button
              onClick={() => {
                startWork(job.id)
                toast.success("Work started — status is In progress.")
              }}
            >
              Start work
            </Button>
          ) : null}
          {showConfirm ? (
            <div className="grid gap-3 border border-hairline bg-surface p-4">
              <EvidenceUpload
                requestId={job.id}
                kind="after"
                tone={afterTone}
                buttonLabel="Attach after photo"
                onUploaded={setAfterEvidence}
              />
              <Button type="button" disabled={!confirmReady} onClick={handleDone}>
                Confirm done — wait for verify
              </Button>
            </div>
          ) : null}
          {job.status === "awaiting_verification" ? (
            <p className="border border-hairline bg-garden-wash p-4 text-ink">
              Waiting for the resident to verify before this job closes.
            </p>
          ) : null}
        </article>
      )}
    </AppShell>
  )
}

export default VendorJobPage
