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
import { useBuilding } from "@/lib/store"
import type { Evidence } from "@/types"

const VendorJobPage = () => {
  const { id } = useParams<{ id: string }>()
  const { visibleRequests, markDone, people } = useBuilding()
  const job = visibleRequests().find((item) => item.id === id)
  const [afterEvidence, setAfterEvidence] = useState<Evidence | null>(null)

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
            <div className="space-y-3">
              <EvidenceUpload
                requestId={job.id}
                kind="after"
                tone={afterTone}
                buttonLabel="Attach after photo"
                onUploaded={setAfterEvidence}
              />
              <Button onClick={() => markDone(job.id, afterEvidence ?? undefined)}>
                Mark done — wait for verify
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
