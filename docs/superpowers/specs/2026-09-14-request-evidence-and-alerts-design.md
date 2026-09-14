# Request Evidence, Context & Alerts — Design

**Status:** Approved for planning (pending user review)  
**Date:** 2026-09-14  
**Relates to:** `BRD.md` FR-2 (resident photo), FR-3 (staff before/after evidence), FR-4 (lifecycle + verify), FR-7 (scripted demo), NFR-4 (v1 accepts file objects), §3 notifications (in-app inbox)

## 1. Problem

The request flow **looks** like it supports photos and accountability, but it does not:

| Surface | What users see today | What BRD expects |
|---|---|---|
| Resident new request | Text field labelled “Photo caption (optional)” | Optional **photo** with message (FR-2.1) |
| Staff triage | Gradient placeholder card + caption | Before/after **evidence** staff can attach (FR-3.3) |
| Staff triage header | `Flat 10-A · Submitted` only | Who filed it, when, flat — at a glance |
| Vendor job | One-click “Attach after photo” (no file) | Evidence upload on completion |
| Alerts inbox | Every notice link says **Open**, even after the request is verified closed | Actionable copy that matches request state |

Evidence is stored as `{ label, caption, tone }` with no bytes. `residentId` exists on the request but is never surfaced on triage. Notifications are created only on submit (`role: staff`); `markDone` and `verify` emit no resident alerts, and inbox links do not reflect lifecycle state.

## 2. Decisions (from brainstorming)

### 2.1 Photo storage

**Use Blocks Data file storage** (`blocksClient.data.files.presignedUploadUrl` + PUT), storing `fileId` on each evidence item. This matches NFR-5 / AGENTS.md (SDK only, no raw fetch to Blocks APIs) and BRD NFR-4 (“v1 accepts file objects”; compression is a later slice).

Rejected alternatives:

- **Caption-only placeholders (status quo)** — fails FR-2.1 / FR-3.3 and the user’s explicit ask.
- **Inline base64 in `evidenceJson`** — quick but bloats Data rows, bypasses storage ACLs, and fights the Blocks file tree model.

Fallback when storage is unavailable (misconfigured tenant): keep caption + gradient placeholder, show a visible `role="status"` warning on the upload control — do not silently pretend a file uploaded.

### 2.2 Evidence shape

Extend `Evidence` (app type + JSON persisted in `evidenceJson`) with optional fields:

```ts
type Evidence = {
  id: string
  kind: "before" | "after"
  label: string
  caption: string
  tone: "lift" | "water" | "pump" | "other"
  fileId?: string      // Blocks file id when uploaded
  mimeType?: string    // for img alt / download
}
```

No Request schema migration required — `evidenceJson` already holds JSON.

### 2.3 Request context block

Add a shared **`RequestContext`** panel on staff triage, resident detail, and vendor job pages:

- **Requested by** — `findPerson(request.residentId, people).name` + title (e.g. Flat 7-B)
- **Flat** — `request.flatId`
- **Submitted** — `formatWhen(request.createdAt)`
- **Status** — existing `statusLabel` (never color-only)

Staff triage header keeps urgency · flat · status meta line; the panel sits directly under the title so “who” is never buried in a caption.

### 2.4 Alert lifecycle (in-app notices)

Keep the existing `Notice` schema (`role`, `title`, `body`, `requestId`, `at`, `read`). No schema change in this slice.

Introduce a small **`src/lib/notices.ts`** helper module:

| Event | Audience | Title pattern | When |
|---|---|---|---|
| Request submitted | `staff` (+ `admin` sees all) | `New request · Flat {flatId}` | existing |
| Vendor assigned | `vendor` | `New job · Flat {flatId}` | `assignVendor` |
| Work ready to verify | `resident` | `Verify work · Flat {flatId}` | `markDone` |
| Verified closed | `resident` | `Request closed · Flat {flatId}` | `verify` |

**Inbox link labels** are derived at render time from the **live** request status (not stored on the notice):

| Request status | Resident link | Staff/admin link |
|---|---|---|
| `awaiting_verification` | **Verify now** | View request |
| `verified_closed` | **View closed request** | View closed request |
| otherwise | **Open request** | **Open triage** |

When a request reaches `verified_closed`, mark **all unread notices** for that `requestId` as read so stale “Open” items disappear from the badge count.

Rejected: adding a `kind` column to Notice — unnecessary for v1; live request status is enough for link copy.

### 2.5 Role behaviour (product)

| Role | Upload | Context | Alerts |
|---|---|---|---|
| **Resident** | Before photo on new request | Own name implicit | Verify + closed confirmations |
| **Staff** | Before (optional on triage) + after on mark done | Full request context | New request → triage |
| **Admin** | Same as staff (admin bypass on staff routes) | Same | All notices |
| **Vendor** | After on mark done | Flat + message summary | Assigned job |
| **Committee** | Read-only on board/desk | Name on cards optional later | Desk-level only |

## 3. Architecture

```
RequestComposer / Staff triage / Vendor job
        │
        ▼
 EvidenceUpload (file + caption)
        │
        ▼
 evidence-storage.ts  ──► blocksClient.data.files.presignedUploadUrl + fetch(PUT)
        │
        ▼
 store.tsx patchRequest ──► evidenceJson on Request row (building-data.ts)

markDone / verify / assignVendor
        │
        ▼
 notices.ts pushNotice ──► Notice row + local state

InboxPage
        │
        ▼
 notices.ts inboxLink(request, notice, role) ──► label + href
```

**Storage directory:** one tenant folder `BashaCare Evidence` (created once, id cached in module memory / sessionStorage). Files named `{requestId}-{kind}-{timestamp}.{ext}`.

**Display:** `EvidenceStrip` — if `fileId`, resolve download URL via `blocksClient.data.files.downloadUrl` (or equivalent SDK method per skill); else existing gradient placeholder for seeded demo rows without files.

## 4. UI notes (DESIGN.md)

- Upload control: bordered surface-2 inset, 44px min touch target, label + optional caption field.
- Real photos: 4:3 thumb, caption with who/when (DESIGN.md evidence rule).
- No purple, no Inter; money stays ৳; status never color-only.
- Bengali message body unchanged; context panel in English chrome.

## 5. Non-goals

- SMS / WhatsApp / push notifications
- Image compression pipeline (later slice per BRD NFR-4)
- Committee override to close without resident verify
- Replacing gradient placeholders in **seed** data (seed keeps working; new uploads get real files)
- Notice schema migration or Blocks notifier service

## 6. Testing

- `npx tsc --noEmit`, `npm run lint`
- New `src/lib/notices-check.ts` (tsx assertion script) for link-label matrix
- Manual: resident submits with photo → staff sees name + image → mark done → resident gets “Verify now” alert → verify → alert reads “View closed request”, badge clears
- Scripted demo (FR-7) still passes with seed captions when no fileIds present
