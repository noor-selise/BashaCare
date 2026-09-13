"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { EvidenceStrip } from "@/components/requests/evidence-strip"
import { StatusRail } from "@/components/requests/status-rail"
import { Button } from "@/components/ui/button"
import { useBuilding } from "@/lib/store"

const VendorJobPage = () => {
  const { id } = useParams<{ id: string }>()
  const { visibleRequests, markDone } = useBuilding()
  const job = visibleRequests().find((item) => item.id === id)

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
          <StatusRail status={job.status} />
          <p className="font-bengali text-lg">{job.message}</p>
          <EvidenceStrip items={job.evidence} />
          {job.status === "assigned" || job.status === "in_progress" || job.status === "acknowledged" ? (
            <Button onClick={() => markDone(job.id, "After · vendor photo")}>
              Attach after photo and mark done
            </Button>
          ) : null}
        </article>
      )}
    </AppShell>
  )
}

export default VendorJobPage
