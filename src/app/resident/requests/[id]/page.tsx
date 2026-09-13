"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { EvidenceStrip } from "@/components/requests/evidence-strip"
import { StatusRail } from "@/components/requests/status-rail"
import { Button } from "@/components/ui/button"
import { formatWhen, statusLabel } from "@/lib/format"
import { findActor } from "@/data/seed"
import { useBuilding } from "@/lib/store"

const ResidentRequestPage = () => {
  const { id } = useParams<{ id: string }>()
  const { visibleRequests, verify, rejectVerify } = useBuilding()
  const request = visibleRequests().find((item) => item.id === id)

  return (
    <AppShell allow={["resident"]}>
      {!request ? (
        <p>This request is not on your flat.</p>
      ) : (
        <article className="space-y-6">
          <Link href="/resident" className="text-sm text-courtyard underline-offset-4 hover:underline">
            Back to requests
          </Link>
          <header>
            <p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">
              {statusLabel(request.status)} · Flat {request.flatId}
            </p>
            <h1 className="font-display text-[32px] leading-tight">Request {request.id}</h1>
          </header>
          <StatusRail status={request.status} />
          <p className="max-w-2xl font-bengali text-lg leading-relaxed">{request.message}</p>
          <EvidenceStrip items={request.evidence} />
          {request.status === "awaiting_verification" ? (
            <div className="flex flex-wrap gap-3 bg-garden-wash p-4">
              <p className="w-full">Staff say the work is done. Was it actually done?</p>
              <Button onClick={() => verify(request.id)}>Verify work</Button>
              <Button variant="ghost" onClick={() => rejectVerify(request.id)}>
                Not done
              </Button>
            </div>
          ) : null}
          <ol className="space-y-2 border-t border-hairline pt-4">
            {request.timeline.map((event) => (
              <li key={event.id} className="text-sm text-ink-soft">
                <span className="font-mono text-ink-faint">{formatWhen(event.at)}</span>
                {" · "}
                {findActor(event.actorId).name}: {event.label}
                {event.detail ? ` — ${event.detail}` : ""}
              </li>
            ))}
          </ol>
        </article>
      )}
    </AppShell>
  )
}

export default ResidentRequestPage
