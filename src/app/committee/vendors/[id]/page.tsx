"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { formatTaka } from "@/lib/money"
import { formatWhen } from "@/lib/format"
import { findVendor } from "@/data/seed"
import { useBuilding } from "@/lib/store"

const VendorHistoryPage = () => {
  const { id } = useParams<{ id: string }>()
  const { requests, decisions } = useBuilding()
  const vendor = findVendor(id)
  const jobs = requests.filter((item) => item.vendorId === id)
  const total = jobs.reduce((sum, item) => sum + (item.cost ?? 0), 0)

  return (
    <AppShell allow={["committee"]}>
      <Link href="/committee" className="text-sm text-courtyard underline-offset-4 hover:underline">
        Back to desk
      </Link>
      <h1 className="mt-4 font-display text-[32px] leading-tight">{vendor?.name ?? "Vendor"}</h1>
      <p className="mt-2 font-mono text-xl">{formatTaka(total)} billed</p>
      <ul className="mt-6 divide-y divide-hairline border-y border-hairline">
        {jobs.map((job) => (
          <li key={job.id} className="flex flex-wrap justify-between gap-2 py-3">
            <span>
              {formatWhen(job.createdAt)} · {job.equipmentId ?? job.category} · {job.status}
            </span>
            <span className="font-mono">{job.cost != null ? formatTaka(job.cost) : "—"}</span>
          </li>
        ))}
      </ul>
      {decisions
        .filter((item) => item.vendorId === id)
        .map((item) => (
          <p key={item.id} className="mt-6 bg-warning-wash p-4">
            {item.body}
          </p>
        ))}
    </AppShell>
  )
}

export default VendorHistoryPage
