"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { EvidenceStrip } from "@/components/requests/evidence-strip"
import { RequestContext } from "@/components/requests/request-context"
import { StatusRail } from "@/components/requests/status-rail"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { formatWhen, statusLabel } from "@/lib/format"
import { findPerson } from "@/data/directory"
import { sameActorId } from "@/lib/request-highlight"
import { needsNewAfterPhoto } from "@/features/requests/lifecycle"
import { useBuilding, useSessionActor } from "@/lib/store"

const ResidentRequestPage = () => {
  const { id } = useParams<{ id: string }>()
  const { requests, verify, rejectVerify, people, session } = useBuilding()
  const actor = useSessionActor()
  const toast = useToast()
  const request = requests.find((item) => item.id === id)
  const owned =
    request &&
    actor &&
    session &&
    (sameActorId(request.residentId, session.actorId) ||
      sameActorId(request.residentId, actor.id) ||
      sameActorId(request.residentId, actor.email))

  return (
    <AppShell allow={["resident"]}>
      {!request ? (
        <p>Request not found.</p>
      ) : !owned ? (
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
            <h1 className="font-display text-[32px] leading-tight">Flat {request.flatId}</h1>
          </header>
          <RequestContext request={request} people={people} />
          <StatusRail status={request.status} />
          <p className="max-w-2xl font-bengali text-lg leading-relaxed">{request.message}</p>
          <EvidenceStrip items={request.evidence} />
          {request.status === "awaiting_verification" ? (
            <div className="flex flex-wrap gap-3 bg-garden-wash p-4">
              <p className="w-full">Staff say the work is done. Was it actually done?</p>
              <Button
                onClick={() => {
                  verify(request.id)
                  toast.success("Verified — request closed.")
                }}
              >
                Verify work
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  rejectVerify(request.id)
                  toast.info("Sent back — staff will continue the work.")
                }}
              >
                Not done
              </Button>
            </div>
          ) : needsNewAfterPhoto(request) ? (
            <p className="border border-hairline bg-garden-wash p-4 text-ink">
              You said the work was not done. Staff are continuing it — watch this request until
              they ask you to verify again.
            </p>
          ) : null}
          <ol className="space-y-2 border-t border-hairline pt-4">
            {request.timeline.map((event) => (
              <li key={event.id} className="text-sm text-ink-soft">
                <span className="font-mono text-ink-faint">{formatWhen(event.at)}</span>
                {" · "}
                {findPerson(event.actorId, people).name}: {event.label}
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
