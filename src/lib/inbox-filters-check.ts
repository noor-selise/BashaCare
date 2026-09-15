import { filterNotices, paginateNotices, PAGE_SIZE } from "@/lib/inbox-filters"
import type { Notice, RequestRecord } from "@/types"

const req = (id: string, status: RequestRecord["status"]): RequestRecord => ({
  id,
  flatId: "10-A",
  residentId: "a@x.com",
  message: "m",
  category: "other",
  urgency: "routine",
  status,
  createdAt: "2026-09-10T00:00:00.000Z",
  evidence: [],
  timeline: []
})

const notice = (partial: Partial<Notice> & Pick<Notice, "id" | "at" | "read">): Notice => ({
  role: "staff",
  title: "t",
  body: "b",
  ...partial
})

const requests = [req("open1", "submitted"), req("closed1", "verified_closed"), req("rej1", "rejected")]
const notices = [
  notice({ id: "1", at: "2026-09-15T06:00:00.000Z", read: false, requestId: "open1" }),
  notice({ id: "2", at: "2026-09-14T06:00:00.000Z", read: true, requestId: "closed1" }),
  notice({ id: "3", at: "2026-09-01T06:00:00.000Z", read: false, requestId: "rej1" }),
  notice({ id: "4", at: "2026-09-15T08:00:00.000Z", read: false })
]

const now = new Date("2026-09-15T12:00:00.000Z")

if (PAGE_SIZE !== 15) throw new Error("PAGE_SIZE")

const unread = filterNotices(notices, requests, { read: "unread", request: "all", datePreset: "all" }, now)
if (unread.length !== 3 || unread.some((n) => n.read)) throw new Error("unread filter")

const open = filterNotices(notices, requests, { read: "all", request: "open", datePreset: "all" }, now)
if (open.map((n) => n.id).join() !== "1") throw new Error("open filter")

const closed = filterNotices(notices, requests, { read: "all", request: "closed", datePreset: "all" }, now)
if (closed.map((n) => n.id).sort().join() !== "2,3") throw new Error("closed filter")

const today = filterNotices(notices, requests, { read: "all", request: "all", datePreset: "today" }, now)
if (!today.every((n) => n.id === "1" || n.id === "4") || today.length !== 2) throw new Error("today")

const sorted = filterNotices(notices, requests, { read: "all", request: "all", datePreset: "all" }, now)
if (sorted[0]?.id !== "4") throw new Error("sort newest first")

const many = Array.from({ length: 20 }, (_, i) =>
  notice({
    id: `n${i}`,
    at: `2026-09-${String(15 - (i % 14)).padStart(2, "0")}T06:00:00.000Z`,
    read: true
  })
)
const page2 = paginateNotices(many, 2)
if (page2.items.length !== 5 || page2.total !== 20 || page2.start !== 16) throw new Error("paginate")

console.log("inbox-filters-check ok")
