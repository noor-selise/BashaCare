import type { Notice, RequestRecord, RequestStatus } from "@/types"

export const PAGE_SIZE = 15

export type ReadFilter = "all" | "unread" | "read"
export type RequestFilter = "all" | "open" | "closed"
export type DatePreset = "all" | "today" | "last7" | "last30" | "custom"

export type InboxFilters = {
  read: ReadFilter
  request: RequestFilter
  datePreset: DatePreset
  fromYmd?: string
  toYmd?: string
}

const DHAKA = "Asia/Dhaka"

const ymdFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: DHAKA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
})

export const calendarDayInDhaka = (value: Date | string): string | null => {
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return null
  return ymdFormatter.format(date)
}

const addDaysYmd = (ymd: string, days: number): string => {
  const [year, month, day] = ymd.split("-").map(Number)
  const next = new Date(Date.UTC(year, month - 1, day + days))
  const y = next.getUTCFullYear()
  const m = String(next.getUTCMonth() + 1).padStart(2, "0")
  const d = String(next.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export const requestBucket = (
  status: RequestStatus | undefined
): "open" | "closed" | null => {
  if (!status) return null
  if (status === "verified_closed" || status === "rejected") return "closed"
  return "open"
}

const matchesDate = (notice: Notice, filters: InboxFilters, now: Date): boolean => {
  if (filters.datePreset === "all") return true

  const noticeDay = calendarDayInDhaka(notice.at)
  if (!noticeDay) return false

  const today = calendarDayInDhaka(now)
  if (!today) return false

  if (filters.datePreset === "today") return noticeDay === today

  if (filters.datePreset === "last7") {
    const start = addDaysYmd(today, -6)
    return noticeDay >= start && noticeDay <= today
  }

  if (filters.datePreset === "last30") {
    const start = addDaysYmd(today, -29)
    return noticeDay >= start && noticeDay <= today
  }

  // custom
  const from = filters.fromYmd?.trim() || undefined
  const to = filters.toYmd?.trim() || undefined
  if (!from && !to) return true
  if (from && noticeDay < from) return false
  if (to && noticeDay > to) return false
  return true
}

export const filterNotices = (
  notices: Notice[],
  requests: RequestRecord[],
  filters: InboxFilters,
  now: Date = new Date()
): Notice[] => {
  const byId = new Map(requests.map((item) => [item.id, item]))

  const filtered = notices.filter((notice) => {
    if (filters.read === "unread" && notice.read) return false
    if (filters.read === "read" && !notice.read) return false

    if (filters.request !== "all") {
      if (!notice.requestId) return false
      const request = byId.get(notice.requestId)
      const bucket = requestBucket(request?.status)
      if (bucket !== filters.request) return false
    }

    if (!matchesDate(notice, filters, now)) return false
    return true
  })

  return filtered.sort((left, right) => {
    return new Date(right.at).getTime() - new Date(left.at).getTime()
  })
}

export type PageResult<T> = {
  page: number
  pageCount: number
  total: number
  start: number
  end: number
  items: T[]
}

export const paginateNotices = <T,>(items: T[], page: number): PageResult<T> => {
  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const clamped = Math.min(Math.max(1, page), pageCount)
  const startIndex = (clamped - 1) * PAGE_SIZE
  const slice = items.slice(startIndex, startIndex + PAGE_SIZE)
  const start = total === 0 ? 0 : startIndex + 1
  const end = total === 0 ? 0 : startIndex + slice.length
  return { page: clamped, pageCount, total, start, end, items: slice }
}
