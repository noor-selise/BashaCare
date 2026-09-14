"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, type FormEvent } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { EvidenceStrip } from "@/components/requests/evidence-strip"
import { EvidenceUpload } from "@/components/requests/evidence-upload"
import { RequestContext } from "@/components/requests/request-context"
import { StatusRail } from "@/components/requests/status-rail"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { useBuilding } from "@/lib/store"
import type { Evidence } from "@/types"

const VendorJobPage = () => {
  const { id } = useParams<{ id: string }>()
  const { visibleRequests, markDone, people } = useBuilding()
  const toast = useToast()
  const job = visibleRequests().find((item) => item.id === id)
  const [afterEvidence, setAfterEvidence] = useState<Evidence | null>(null)
  const [cost, setCost] = useState("")

  const handleDone = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const raw = new FormData(event.currentTarget).get("cost")
    let parsedCost: number | undefined
    if (raw !== null && String(raw).trim() !== "") {
      const value = Number(raw)
      if (Number.isFinite(value) && value >= 0) parsedCost = value
    }
    markDone(job!.id, afterEvidence ?? undefined, parsedCost)
    toast.success("Marked done — waiting for resident to verify.")
  }

  const afterTone: Evidence["tone"] =
    job?.category === "lift"
      ? "lift"
      : job?.category === "water" || job?.category === "plumbing"
        ? "water"
        : "other"

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
          {job.status === "assigned" || job.status === "in_progress" || job.status === "acknowledged" ? (
            <form onSubmit={handleDone} className="grid gap-3 border border-hairline bg-surface p-4">
              <EvidenceUpload
                requestId={job.id}
                kind="after"
                tone={afterTone}
                buttonLabel="Attach after photo"
                onUploaded={setAfterEvidence}
              />
              <label htmlFor="vendor-cost">
                Cost (৳)
                <input
                  id="vendor-cost"
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
