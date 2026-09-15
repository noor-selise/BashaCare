"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/cn"
import { formatWhen } from "@/lib/format"
import {
  filterNotices,
  paginateNotices,
  requestBucket,
  type DatePreset,
  type InboxFilters,
  type ReadFilter,
  type RequestFilter
} from "@/lib/inbox-filters"
import { inboxLink } from "@/lib/notices"
import { isUnreadNotice } from "@/lib/request-highlight"
import { roleHome } from "@/lib/session/role-home"
import type { Notice, RequestRecord, Role } from "@/types"

const defaultFilters = (): InboxFilters => ({
  read: "all",
  request: "all",
  datePreset: "all",
  fromYmd: "",
  toYmd: ""
})

type AlertsTableProps = {
  notices: Notice[]
  requests: RequestRecord[]
  role: Role
  onMarkRead: (id: string) => void
}

export const AlertsTable = ({ notices, requests, role, onMarkRead }: AlertsTableProps) => {
  const [filters, setFilters] = useState<InboxFilters>(defaultFilters)
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return filterNotices(notices, requests, filters)
  }, [notices, requests, filters])

  const pageResult = useMemo(() => paginateNotices(filtered, page), [filtered, page])

  const updateFilters = (patch: Partial<InboxFilters>) => {
    setFilters((current) => ({ ...current, ...patch }))
    setPage(1)
  }

  const handleClear = () => {
    setFilters(defaultFilters())
    setPage(1)
  }

  const requestById = useMemo(() => {
    return new Map(requests.map((item) => [item.id, item]))
  }, [requests])

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          Read
          <select
            className="min-h-11 border border-hairline bg-surface-2 px-3 text-[16px] font-normal normal-case tracking-normal text-ink"
            value={filters.read}
            onChange={(event) => updateFilters({ read: event.target.value as ReadFilter })}
            aria-label="Filter by read status"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          Request
          <select
            className="min-h-11 border border-hairline bg-surface-2 px-3 text-[16px] font-normal normal-case tracking-normal text-ink"
            value={filters.request}
            onChange={(event) => updateFilters({ request: event.target.value as RequestFilter })}
            aria-label="Filter by request status"
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          Date
          <select
            className="min-h-11 border border-hairline bg-surface-2 px-3 text-[16px] font-normal normal-case tracking-normal text-ink"
            value={filters.datePreset}
            onChange={(event) => updateFilters({ datePreset: event.target.value as DatePreset })}
            aria-label="Filter by date range"
          >
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="last7">Last 7 days</option>
            <option value="last30">Last 30 days</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        {filters.datePreset === "custom" ? (
          <>
            <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
              From
              <input
                type="date"
                className="min-h-11 border border-hairline bg-surface-2 px-3 text-[16px] font-normal normal-case tracking-normal text-ink"
                value={filters.fromYmd ?? ""}
                onChange={(event) => updateFilters({ fromYmd: event.target.value })}
                aria-label="Custom date from"
              />
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
              To
              <input
                type="date"
                className="min-h-11 border border-hairline bg-surface-2 px-3 text-[16px] font-normal normal-case tracking-normal text-ink"
                value={filters.toYmd ?? ""}
                onChange={(event) => updateFilters({ toYmd: event.target.value })}
                aria-label="Custom date to"
              />
            </label>
          </>
        ) : null}
        <Button type="button" variant="ghost" onClick={handleClear}>
          Clear filters
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No alerts match"
          body="Try another status or date range, or clear filters."
          actionLabel="Clear filters"
          onAction={handleClear}
        />
      ) : (
        <>
          <div className="overflow-x-auto border border-hairline bg-surface">
            <table className="min-w-[720px] w-full border-collapse text-left text-[15px]">
              <thead>
                <tr className="border-b border-hairline bg-surface-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                  <th className="px-3 py-3 font-semibold">When</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Title</th>
                  <th className="px-3 py-3 font-semibold">Detail</th>
                  <th className="px-3 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageResult.items.map((item) => {
                  const request = item.requestId ? requestById.get(item.requestId) : undefined
                  const link = item.requestId
                    ? inboxLink(item, request, role)
                    : { href: roleHome(role), label: "Home" }
                  const unread = isUnreadNotice(item)
                  const bucket = requestBucket(request?.status)
                  const statusParts = [unread ? "New" : "Read"]
                  if (bucket) statusParts.push(bucket === "open" ? "Open" : "Closed")

                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "border-b border-hairline last:border-b-0",
                        unread ? "border-l-4 border-l-courtyard bg-courtyard-soft" : "bg-surface"
                      )}
                    >
                      <td className="whitespace-nowrap px-3 py-3 align-top text-ink-faint">
                        {formatWhen(item.at)}
                      </td>
                      <td className="px-3 py-3 align-top text-ink-soft">{statusParts.join(" · ")}</td>
                      <td className="px-3 py-3 align-top font-display text-lg leading-snug">
                        {item.title}
                      </td>
                      <td
                        className="max-w-[18rem] truncate px-3 py-3 align-top text-ink-soft"
                        title={item.body}
                      >
                        {item.body}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <Link
                          href={link.href}
                          className="text-courtyard underline-offset-4 hover:underline"
                          onClick={() => onMarkRead(item.id)}
                        >
                          {link.label}
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft" role="status">
              Showing {pageResult.start}–{pageResult.end} of {pageResult.total}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={pageResult.page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                aria-label="Previous page"
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={pageResult.page >= pageResult.pageCount}
                onClick={() => setPage((current) => current + 1)}
                aria-label="Next page"
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
