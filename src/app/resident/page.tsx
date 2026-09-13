"use client"

import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { RequestCard } from "@/components/requests/request-card"
import { EmptyState } from "@/components/ui/empty-state"
import { useBuilding, useSessionActor } from "@/lib/store"

const ResidentHome = () => {
  const actor = useSessionActor()
  const { visibleRequests } = useBuilding()
  const mine = visibleRequests()
  const open = mine.filter((item) => item.status !== "verified_closed")
  const closed = mine.filter((item) => item.status === "verified_closed")

  return (
    <AppShell allow={["resident"]}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Flat {actor?.flatId}</p>
          <h1 className="font-display text-[32px] leading-tight">Your requests</h1>
        </div>
        <Link
          href="/resident/new"
          className="inline-flex min-h-11 items-center rounded-[8px] bg-courtyard px-4 text-surface"
        >
          New request
        </Link>
      </div>
      <section className="mt-8 space-y-3">
        {open.length === 0 ? (
          <EmptyState
            title="Nothing open"
            body="When something breaks, write it here. You will see status without calling anyone."
          />
        ) : (
          open.map((item) => (
            <RequestCard key={item.id} request={item} href={`/resident/requests/${item.id}`} />
          ))
        )}
      </section>
      {closed.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-xl">Recently closed</h2>
          <div className="mt-3 space-y-3 opacity-80">
            {closed.map((item) => (
              <RequestCard key={item.id} request={item} href={`/resident/requests/${item.id}`} />
            ))}
          </div>
        </section>
      ) : null}
    </AppShell>
  )
}

export default ResidentHome
