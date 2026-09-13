import Link from "next/link"
import { formatTaka } from "@/lib/money"
import { openUrgents, vendorSpend } from "@/features/spend/rollups"
import type { Decision, RequestRecord, Vendor } from "@/types"

type CommitteeDeskProps = {
  requests: RequestRecord[]
  vendors: Vendor[]
  decisions: Decision[]
}

export const CommitteeDesk = ({ requests, vendors, decisions }: CommitteeDeskProps) => {
  const urgentOpen = openUrgents(requests)
  const billed = vendorSpend(requests, vendors)
  const slow = billed[0]
  const pumpTotal = requests
    .filter((item) => item.equipmentId === "roof-pump")
    .reduce((sum, item) => sum + (item.cost ?? 0), 0)

  return (
    <>
      <h1 className="font-display text-[32px] leading-tight">Desk</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Which vendor is slow, what they cost, and which urgent incidents are open right now.
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="border border-terracotta bg-terracotta-wash p-5">
          <h2 className="text-[11px] uppercase tracking-[0.08em]">Open urgents</h2>
          <p className="mt-3 font-display text-4xl">{urgentOpen.length}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {urgentOpen.map((item) => (
              <li key={item.id}>
                Flat {item.flatId} · {item.urgency}
              </li>
            ))}
          </ul>
        </section>
        <section className="border border-hairline bg-surface p-5">
          <h2 className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Slow / expensive</h2>
          <p className="mt-3 font-display text-2xl">{slow?.vendor.name}</p>
          <p className="mt-2 font-mono text-xl">{formatTaka(slow?.total ?? 0)}</p>
          <p className="mt-2 text-sm text-ink-soft">
            {slow?.count} billed jobs
            {slow?.repeats ? ` · ${slow.repeats} repeats on the same pump` : ""}
          </p>
          <Link
            href={`/committee/vendors/${slow?.vendor.id}`}
            className="mt-4 inline-flex min-h-11 items-center text-courtyard underline-offset-4 hover:underline"
          >
            Vendor history
          </Link>
        </section>
        <section className="border border-hairline bg-surface p-5">
          <h2 className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Spend</h2>
          <ul className="mt-4 space-y-3">
            {billed.map((row) => (
              <li key={row.vendor.id} className="flex justify-between gap-3">
                <span>{row.vendor.name}</span>
                <span className="font-mono">{formatTaka(row.total)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="mt-10 bg-warning-wash p-5">
        <p className="text-[11px] uppercase tracking-[0.08em]">Replace recommendation</p>
        <h2 className="mt-2 font-display text-2xl">Roof pump</h2>
        <p className="mt-2 max-w-2xl">
          Six repairs in five months totaling {formatTaka(pumpTotal)} from Rahman Pump Service.
          Another patch is cheaper this month and more expensive this year.
        </p>
        {decisions.map((decision) => (
          <p key={decision.id} className="mt-4 border-l-2 border-warning pl-3">
            Recorded decision: {decision.body}
          </p>
        ))}
      </section>
    </>
  )
}
