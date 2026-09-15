# Alerts table — design

**Date:** 2026-09-15  
**Route:** `/inbox`  
**Status:** Approved for planning (Approach 1)

## Goal

Replace the Alerts card list with a **paginated table** that can filter by **read state**, **linked-request open/closed**, and **date range** (presets + custom From/To). Run and verify locally; no deploy/push unless asked.

## Decisions

| Topic | Choice |
|---|---|
| Approach | Client-side filter + paginate on notices already in the store |
| Page size | **15** |
| Status | **Both** dimensions: read (Unread/Read) and request (Open/Closed) |
| Date | Presets **and** optional custom From/To |
| Sort | Newest first (`notice.at` descending) |

## Out of scope

- New Blocks queries or server-side paging
- Shared reusable DataTable kit for other screens
- Changing how notices are created or marked read (keep `markNoticeRead` + `inboxLink`)
- Deploy / push

## Layout

1. **H1** — “Alerts” (unchanged)
2. **Toolbar** (one row that wraps on narrow viewports):
   - Read filter: `All` · `Unread` · `Read`
   - Request filter: `All` · `Open` · `Closed`
   - Date preset: `All` · `Today` · `Last 7 days` · `Last 30 days` · `Custom`
   - When preset is `Custom`: From + To (`type="date"`, inclusive calendar days in `Asia/Dhaka`)
   - Clear filters (resets all filters and page to 1)
3. **Table** columns:
   - **When** — `formatWhen(notice.at)`
   - **Status** — read label (`New` / `Read`); if linked request exists, also open/closed text (not color-only)
   - **Title**
   - **Detail** — `body` (truncate with CSS on small widths; full text in `title` attribute)
   - **Action** — existing `inboxLink` label; click marks notice read
4. **Footer** — `Showing X–Y of Z` + Previous / Next (disabled at ends)

Unread rows keep courtyard left-border emphasis (same signal as today’s cards).

Empty states:

- No alerts for role → existing “Quiet” empty state
- Alerts exist but filters match none → “No alerts match” + Clear filters

## Filter semantics

Filters **AND** together. Role scoping stays as today (admin sees all; others see `role === all` or own role).

### Read

- `All` — no read filter
- `Unread` — `!notice.read`
- `Read` — `notice.read`

### Request

- `All` — no request-status filter
- `Open` — notice has `requestId` and linked request status is **not** `verified_closed` or `rejected`
- `Closed` — linked request status is `verified_closed` **or** `rejected`
- Notices **without** a linked request (or missing request row) **do not match** `Open` or `Closed`; they only appear when Request is `All`

### Date (`notice.at`)

- `All` — no date filter
- `Today` — same calendar day as now in `Asia/Dhaka`
- `Last 7 days` / `Last 30 days` — inclusive window ending today (Dhaka)
- `Custom` — From and/or To filled; inclusive start-of-day From through end-of-day To in Dhaka. Incomplete custom range (neither date set) behaves like `All` until at least one bound is set.

Changing any filter resets page to **1**.

## Pagination

- Page size fixed at **15** (not user-configurable in v1)
- Slice after filter + sort
- Prev/Next only (no page-number jumplist)

## Architecture

| Piece | Responsibility |
|---|---|
| `src/lib/inbox-filters.ts` (new) | Pure helpers: derive open/closed, apply filters, sort, paginate; unit-testable without React |
| `src/components/inbox/alerts-table.tsx` (new) | Toolbar + table + footer; receives role-scoped notices + requests |
| `src/app/inbox/page.tsx` | Role filter + shell; render `AlertsTable` |

No new npm dependencies. Styling follows `DESIGN.md` (hairline borders, courtyard unread cue, no purple/Inter).

Mobile: table in a horizontal scroll container; toolbar wraps. Do not invent a second card layout.

## Data flow

```
useBuilding().notices + requests
  → role-scope (existing page logic)
  → inbox-filters (status + date + sort + page)
  → AlertsTable rows
  → Action link → markNoticeRead(id) + navigate
```

URL query sync is **not** required in v1 (filters are component state).

## Error / edge handling

- Missing linked request: Status shows read only; Action falls back to Home via existing `inboxLink`
- Invalid/missing `at`: exclude from date-filtered views; still show when date is `All`
- Page beyond last after filter shrink: clamp to last page (or page 1)

## Verification (local)

1. Open `/inbox` with several alerts — table shows 15/page, newest first
2. Filter Unread / Read / Open / Closed — counts and rows match
3. Today / Last 7 / Last 30 / Custom From–To — rows match Dhaka calendar bounds
4. Clear filters — full list, page 1
5. Action still marks read and opens the right request
6. Narrow viewport — toolbar wraps; table scrolls horizontally

## Success criteria

- Card list gone; table + toolbar + pagination present
- Status (read + request) and date (presets + custom) filters work with AND semantics
- 15 rows per page; filter changes reset to page 1
- Unread still visually distinct without relying on color alone
- No deploy/push unless explicitly requested
