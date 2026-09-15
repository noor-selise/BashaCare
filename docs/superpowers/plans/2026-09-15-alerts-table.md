# Alerts Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/inbox` card list with a client-side paginated alerts table (15/page) filtered by read, request open/closed, and date presets/custom range.

**Architecture:** Pure helpers in `inbox-filters.ts`; UI in `alerts-table.tsx`; thin role-scope in `inbox/page.tsx`. No new deps; verify with `tsx` check script.

**Tech Stack:** Next.js App Router, React 19, Tailwind 4, existing `Notice` / `RequestRecord` types, `formatWhen`, `inboxLink`, `Button`.

## Global Constraints

- Page size **15**; sort newest-first by `notice.at`
- Filters AND together; Dhaka calendar for dates
- No deploy/push unless asked; follow `DESIGN.md`
- Keep `markNoticeRead` + `inboxLink` behavior

---

### Task 1: Filter / paginate helpers + check

**Files:**
- Create: `src/lib/inbox-filters.ts`
- Create: `src/lib/inbox-filters-check.ts`
- Modify: `package.json` (add `check:inbox` script)

**Interfaces:**
- Produces:
  - `PAGE_SIZE = 15`
  - `ReadFilter = "all" | "unread" | "read"`
  - `RequestFilter = "all" | "open" | "closed"`
  - `DatePreset = "all" | "today" | "last7" | "last30" | "custom"`
  - `InboxFilters` `{ read, request, datePreset, fromYmd?, toYmd? }`
  - `requestBucket(status): "open" | "closed" | null`
  - `filterNotices(notices, requests, filters, now?): Notice[]`
  - `paginateNotices(notices, page): { page, pageCount, total, start, end, items }`

- [ ] **Step 1: Write check script (failing until helpers exist)**

```ts
// src/lib/inbox-filters-check.ts
import { filterNotices, paginateNotices, PAGE_SIZE } from "@/lib/inbox-filters"
import type { Notice, RequestRecord } from "@/types"

const req = (id: string, status: RequestRecord["status"]): RequestRecord => ({
  id, flatId: "10-A", residentId: "a@x.com", message: "m", category: "other",
  urgency: "routine", status, createdAt: "2026-09-10T00:00:00.000Z", evidence: [], timeline: []
})

const notice = (partial: Partial<Notice> & Pick<Notice, "id" | "at" | "read">): Notice => ({
  role: "staff", title: "t", body: "b", ...partial
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
  notice({ id: `n${i}`, at: `2026-09-${String(15 - (i % 14)).padStart(2, "0")}T06:00:00.000Z`, read: true })
)
const page2 = paginateNotices(many, 2)
if (page2.items.length !== 5 || page2.total !== 20 || page2.start !== 16) throw new Error("paginate")

console.log("inbox-filters-check ok")
```

- [ ] **Step 2: Implement `src/lib/inbox-filters.ts`**

Implement Dhaka `YYYY-MM-DD` via `Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", ... })`. Apply AND filters per spec; invalid `at` excluded when date ≠ all; paginate clamps page.

- [ ] **Step 3: Run check**

Run: `npx tsx src/lib/inbox-filters-check.ts`  
Expected: `inbox-filters-check ok`

- [ ] **Step 4: Add script + commit**

`package.json`: `"check:inbox": "npx tsx src/lib/inbox-filters-check.ts"`

```bash
git add src/lib/inbox-filters.ts src/lib/inbox-filters-check.ts package.json
git commit -m "feat(inbox): add client filter and pagination helpers"
```

---

### Task 2: AlertsTable UI + wire page

**Files:**
- Create: `src/components/inbox/alerts-table.tsx`
- Modify: `src/app/inbox/page.tsx`
- Modify: `change.md`

**Interfaces:**
- Consumes: `filterNotices`, `paginateNotices`, `PAGE_SIZE`, types from Task 1; `formatWhen`, `inboxLink`, `isUnreadNotice`, `Button`, `EmptyState`
- Produces: `AlertsTable({ notices, requests, role, onMarkRead })`

- [ ] **Step 1: Build `AlertsTable`**

Toolbar selects + custom dates; table columns When / Status / Title / Detail / Action; footer Showing X–Y of Z + Prev/Next; clear resets filters + page; filter change → page 1; unread left courtyard border; horizontal scroll wrapper.

Status cell: `New` or `Read`; if linked request, append ` · Open` or ` · Closed`.

- [ ] **Step 2: Slim `inbox/page.tsx`**

Role-scope notices; if empty Quiet; else `<AlertsTable ... />`.

- [ ] **Step 3: Local verify**

Run `npm run check:inbox` and `npm run lint` (or eslint on touched files). Manually open `/inbox` if dev server running.

- [ ] **Step 4: Changelog + commit**

```bash
git add src/components/inbox/alerts-table.tsx src/app/inbox/page.tsx change.md
git commit -m "feat(inbox): paginated alerts table with status and date filters"
```

---

## Spec coverage

| Spec item | Task |
|---|---|
| Table columns + unread cue | 2 |
| Read + request + date filters | 1 + 2 |
| 15/page, sort, clamp | 1 |
| Clear + empty match state | 2 |
| inboxLink + mark read | 2 |
| No deploy | global |

## Self-review

- No placeholders; Closed includes rejected in helpers
- Types consistent across tasks
- Check script uses assert-style throws matching repo pattern
