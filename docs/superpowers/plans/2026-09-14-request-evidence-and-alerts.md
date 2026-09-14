# Request Evidence, Context & Alerts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real photo upload via Blocks file storage, show who requested on triage, and make inbox alerts lifecycle-aware so “Open” only appears when action is still required.

**Architecture:** Extend `Evidence` with optional `fileId`, upload through `blocksClient.data.files` presigned URLs into a cached `BashaCare Evidence` directory, render real thumbnails in `EvidenceStrip`, add a shared `RequestContext` panel, and centralize notice creation/link labelling in `src/lib/notices.ts` wired from `store.tsx` lifecycle actions.

**Tech Stack:** Next.js 16 App Router, React 19, `@seliseblocks/client`, Tailwind v4, existing `building-data.ts` Request/Notice persistence.

**Spec:** `docs/superpowers/specs/2026-09-14-request-evidence-and-alerts-design.md`

## Global Constraints

- Blocks access only through `@seliseblocks/client` — never raw `fetch`/`curl` to `api.seliseblocks.com` except the SDK-documented PUT to the presigned upload URL returned by Blocks. (Spec §2.1, AGENTS.md)
- Tenant: `D975c4874bd6b47b995cce54f926c09cc`, CLI account `noor` when mutating storage config. Dry-run before `--yes` on any CLI mutation.
- Status is never color-only; copy uses `statusLabel` / `urgencyLabel`. (DESIGN.md, BRD NFR-2)
- Money is ৳ via `formatTaka`. Bengali resident messages use `font-bengali`. (DESIGN.md)
- No new test framework — use `npx tsc --noEmit`, `npm run lint`, and `tsx` assertion scripts like `src/data/seed-check.ts`. (Repo convention)
- Seeded demo requests without `fileId` must keep rendering (gradient placeholders). (Spec §5)

---

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `src/types/index.ts` | Modify | Add `fileId?`, `mimeType?` on `Evidence` |
| `src/lib/notices.ts` | Create | `pushNotice` shape helpers, `inboxLink`, `markRequestNoticesRead` |
| `src/lib/notices-check.ts` | Create | Assertion script for inbox link matrix |
| `src/lib/blocks/evidence-storage.ts` | Create | Ensure evidence directory, presigned upload, download URL |
| `src/components/requests/evidence-upload.tsx` | Create | File input + caption + preview + upload state |
| `src/components/requests/request-context.tsx` | Create | Requested-by / flat / submitted panel |
| `src/components/requests/evidence-strip.tsx` | Modify | Render real image when `fileId` present |
| `src/components/requests/request-composer.tsx` | Modify | Replace caption-only with `EvidenceUpload` |
| `src/lib/store.tsx` | Modify | Wire uploads + lifecycle notices |
| `src/app/staff/requests/[id]/page.tsx` | Modify | Context panel + before/after upload on mark done |
| `src/app/vendor/jobs/[id]/page.tsx` | Modify | After upload on mark done |
| `src/app/inbox/page.tsx` | Modify | Lifecycle-aware link labels + hrefs |
| `src/app/resident/requests/[id]/page.tsx` | Modify | Add `RequestContext` for parity |
| `change.md` | Modify | Changelog entry |

---

### Task 1: Types and notice helpers

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/lib/notices.ts`
- Create: `src/lib/notices-check.ts`
- Test: `src/lib/notices-check.ts`

**Interfaces:**
- Produces: extended `Evidence`, `inboxLink({ notice, request, role }) => { href, label }`, `noticeForEvent(event, request) => Omit<Notice, "id" | "read">`

- [ ] **Step 1: Extend Evidence type**

In `src/types/index.ts`, add optional fields to `Evidence`:

```ts
export type Evidence = {
  id: string
  kind: "before" | "after"
  label: string
  caption: string
  tone: "lift" | "water" | "pump" | "other"
  fileId?: string
  mimeType?: string
}
```

- [ ] **Step 2: Create `src/lib/notices.ts`**

```ts
import type { Notice, RequestRecord, Role } from "@/types"
import { roleHome } from "@/lib/session/role-home"

export type NoticeEvent = "submitted" | "assigned" | "ready_to_verify" | "verified_closed"

export const noticeDraft = (
  event: NoticeEvent,
  request: Pick<RequestRecord, "id" | "flatId" | "message">
): Omit<Notice, "id" | "read" | "at"> => {
  switch (event) {
    case "submitted":
      return {
        role: "staff",
        title: `New request · Flat ${request.flatId}`,
        body: request.message.slice(0, 120),
        requestId: request.id
      }
    case "assigned":
      return {
        role: "vendor",
        title: `New job · Flat ${request.flatId}`,
        body: request.message.slice(0, 120),
        requestId: request.id
      }
    case "ready_to_verify":
      return {
        role: "resident",
        title: `Verify work · Flat ${request.flatId}`,
        body: "Staff marked the work done. Confirm before it closes.",
        requestId: request.id
      }
    case "verified_closed":
      return {
        role: "resident",
        title: `Request closed · Flat ${request.flatId}`,
        body: "You verified the work. This request is closed.",
        requestId: request.id
      }
  }
}

export const inboxLink = (
  notice: Notice,
  request: RequestRecord | undefined,
  role: Role
): { href: string; label: string } => {
  if (!request || !notice.requestId) {
    return { href: roleHome(role), label: "Home" }
  }

  const base =
    role === "resident"
      ? `/resident/requests/${request.id}`
      : role === "vendor"
        ? `/vendor/jobs/${request.id}`
        : `/staff/requests/${request.id}`

  if (role === "resident" && request.status === "awaiting_verification") {
    return { href: base, label: "Verify now" }
  }

  if (request.status === "verified_closed") {
    return { href: base, label: "View closed request" }
  }

  if (role === "resident") {
    return { href: base, label: "Open request" }
  }

  return { href: base, label: role === "vendor" ? "Open job" : "Open triage" }
}
```

- [ ] **Step 3: Create assertion script `src/lib/notices-check.ts`**

Assert `inboxLink` returns `Verify now` for resident + `awaiting_verification`, and `View closed request` for any role + `verified_closed`. Exit non-zero on failure (mirror `seed-check.ts`).

- [ ] **Step 4: Run checks**

Run: `npx tsx src/lib/notices-check.ts && npx tsc --noEmit && npm run lint`  
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/lib/notices.ts src/lib/notices-check.ts
git commit -m "feat(notices): add lifecycle-aware inbox link helpers"
```

---

### Task 2: Blocks evidence storage

**Files:**
- Create: `src/lib/blocks/evidence-storage.ts`

**Interfaces:**
- Produces: `uploadEvidenceFile(file: File, requestId: string, kind: Evidence["kind"]) => Promise<{ fileId: string; mimeType: string }>`, `evidenceDownloadUrl(fileId: string) => Promise<string | null>`

- [ ] **Step 1: Read `.cursor/skills/blocks-data-storage/SKILL.md` cloud upload section**

Use `blocksClient.data.files.presignedUploadUrl` then `fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } })`.

- [ ] **Step 2: Implement directory bootstrap**

Lazy-create directory named `BashaCare Evidence` via `blocksClient.data.directories.create` (or list + find). Cache directory id in module-level variable.

- [ ] **Step 3: Implement upload + download helpers**

```ts
export const uploadEvidenceFile = async (file: File, requestId: string, kind: "before" | "after") => {
  const client = getBlocksClient()
  if (!client) throw new Error("Blocks is not configured — photo upload needs hosted storage.")

  const directoryId = await ensureEvidenceDirectory(client)
  const name = `${requestId}-${kind}-${Date.now()}.${extensionFrom(file)}`

  const presign = await client.data.files.presignedUploadUrl({
    name,
    parentDirectoryId: directoryId,
    configurationName: "Default",
    accessModifier: "Private"
  })

  const uploadUrl = presign.uploadUrl ?? presign.data?.uploadUrl
  const fileId = presign.fileId ?? presign.data?.fileId
  if (!uploadUrl || !fileId) throw new Error("Could not start file upload.")

  const put = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type || "application/octet-stream" } })
  if (!put.ok) throw new Error("Photo upload failed.")

  return { fileId, mimeType: file.type || "application/octet-stream" }
}
```

Implement `evidenceDownloadUrl` using the SDK download/presigned-get method from the skill (read skill for exact method name before coding).

- [ ] **Step 4: Run `npx tsc --noEmit`**

- [ ] **Step 5: Commit**

```bash
git add src/lib/blocks/evidence-storage.ts
git commit -m "feat(storage): upload and resolve request evidence files"
```

---

### Task 3: EvidenceUpload component

**Files:**
- Create: `src/components/requests/evidence-upload.tsx`

**Interfaces:**
- Produces: `<EvidenceUpload label kind tone onUploaded={(evidence: Evidence) => void} />`

- [ ] **Step 1: Build accessible file control**

- Hidden `<input type="file" accept="image/*" />` triggered by button
- Optional caption field
- Local preview via `URL.createObjectURL`
- `role="status"` for uploading / error states
- Calls parent `onUploaded` with full `Evidence` object after upload completes

- [ ] **Step 2: Wire to `uploadEvidenceFile`**

Pass `requestId` and `kind` props. On success:

```ts
onUploaded({
  id: crypto.randomUUID().slice(0, 8),
  kind,
  label: kind === "before" ? "Before" : "After",
  caption: caption.trim() || file.name,
  tone,
  fileId,
  mimeType
})
```

- [ ] **Step 3: Manual smoke on resident `/resident/new`**

- [ ] **Step 4: Commit**

```bash
git add src/components/requests/evidence-upload.tsx
git commit -m "feat(ui): add evidence file upload control"
```

---

### Task 4: EvidenceStrip real thumbnails

**Files:**
- Modify: `src/components/requests/evidence-strip.tsx`

**Interfaces:**
- Consumes: `evidenceDownloadUrl(fileId)` from Task 2

- [ ] **Step 1: Add client-side URL resolution**

For each item with `fileId`, `useEffect` fetch download URL and render `<img>` with `alt={item.caption}`, 4:3 aspect, lazy loading. Keep gradient fallback when no `fileId` or URL fails.

- [ ] **Step 2: Verify seeded demo still renders gradients**

- [ ] **Step 3: Commit**

```bash
git add src/components/requests/evidence-strip.tsx
git commit -m "feat(ui): show uploaded evidence thumbnails"
```

---

### Task 5: RequestContext panel

**Files:**
- Create: `src/components/requests/request-context.tsx`

**Interfaces:**
- Consumes: `RequestRecord`, `Person[]`
- Produces: `<RequestContext request={request} people={people} />`

- [ ] **Step 1: Implement panel**

```tsx
export const RequestContext = ({ request, people }: { request: RequestRecord; people: Person[] }) => {
  const resident = findPerson(request.residentId, people)
  return (
    <dl className="grid gap-3 border border-hairline bg-surface-2 p-4 sm:grid-cols-3">
      <div>
        <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Requested by</dt>
        <dd className="mt-1 text-ink">{resident.name}</dd>
        <dd className="text-sm text-ink-soft">{resident.title}</dd>
      </div>
      <div>
        <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Flat</dt>
        <dd className="mt-1 font-mono">{request.flatId}</dd>
      </div>
      <div>
        <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Submitted</dt>
        <dd className="mt-1 text-ink-soft">{formatWhen(request.createdAt)}</dd>
      </div>
    </dl>
  )
}
```

- [ ] **Step 2: Add to staff triage, resident detail, vendor job pages**

Insert below page header / above message body.

- [ ] **Step 3: Commit**

```bash
git add src/components/requests/request-context.tsx src/app/staff/requests/[id]/page.tsx src/app/resident/requests/[id]/page.tsx src/app/vendor/jobs/[id]/page.tsx
git commit -m "feat(ui): show who requested on request detail pages"
```

---

### Task 6: Resident composer + store submit

**Files:**
- Modify: `src/components/requests/request-composer.tsx`
- Modify: `src/lib/store.tsx`

**Interfaces:**
- Modifies: `submitRequest` to accept optional `Evidence[]` or upload before persist

- [ ] **Step 1: Replace caption input with EvidenceUpload**

Collect one optional before evidence. Disable submit while upload in flight.

- [ ] **Step 2: Change `submitRequest` signature**

```ts
submitRequest: (input: { message: string; evidence?: Evidence[] }) => string
```

Use `noticeDraft("submitted", record)` instead of inline notice object.

- [ ] **Step 3: Commit**

```bash
git add src/components/requests/request-composer.tsx src/lib/store.tsx
git commit -m "feat(resident): submit requests with photo evidence"
```

---

### Task 7: Staff/vendor mark-done uploads + lifecycle notices

**Files:**
- Modify: `src/lib/store.tsx`
- Modify: `src/app/staff/requests/[id]/page.tsx`
- Modify: `src/app/vendor/jobs/[id]/page.tsx`

- [ ] **Step 1: Extend `markDone` to accept `Evidence` item**

Replace caption-only after stub with uploaded evidence object.

- [ ] **Step 2: On `markDone`, push resident notice**

```ts
const draft = noticeDraft("ready_to_verify", item)
void saveNotice({ ...draft, id: nextId("n"), at: now(), read: false })
```

- [ ] **Step 3: On `assignVendor`, push vendor notice** using `noticeDraft("assigned", ...)`

- [ ] **Step 4: On `verify`, push closed notice + mark all notices for requestId read**

```ts
const markRequestNoticesRead = (requestId: string) => {
  setState((current) => ({
    ...current,
    notices: current.notices.map((n) =>
      n.requestId === requestId ? { ...n, read: true } : n
    )
  }))
  // persist each unread id via markNoticeReadRemote
}
```

- [ ] **Step 5: Staff triage — replace after caption form with EvidenceUpload + cost field**

- [ ] **Step 6: Vendor job — same for after photo**

- [ ] **Step 7: Commit**

```bash
git add src/lib/store.tsx src/app/staff/requests/[id]/page.tsx src/app/vendor/jobs/[id]/page.tsx src/lib/notices.ts
git commit -m "feat(lifecycle): evidence on mark-done and resident verify alerts"
```

---

### Task 8: Inbox lifecycle links

**Files:**
- Modify: `src/app/inbox/page.tsx`

**Interfaces:**
- Consumes: `inboxLink`, requests from `useBuilding()`

- [ ] **Step 1: Resolve request per notice**

```ts
const request = item.requestId ? requests.find((r) => r.id === item.requestId) : undefined
const link = inboxLink(item, request, actor.role)
```

- [ ] **Step 2: Render `link.label` instead of hardcoded "Open"**

Use `link.href` for staff/admin/vendor/resident paths (remove committee → `/committee` dead-end for request notices).

- [ ] **Step 3: Manual test matrix**

| Step | Expect |
|---|---|
| Staff submits triage from alert | Link says Open triage |
| Resident after mark done | Alert says Verify now |
| After resident verifies | Alert says View closed request; badge count 0 |

- [ ] **Step 4: Commit**

```bash
git add src/app/inbox/page.tsx
git commit -m "fix(inbox): lifecycle-aware alert links"
```

---

### Task 9: Changelog and verification

**Files:**
- Modify: `change.md`

- [ ] **Step 1: Add changelog entry**

- [ ] **Step 2: Run full verification**

```bash
npx tsx src/lib/notices-check.ts
npx tsx src/data/seed-check.ts
npx tsc --noEmit
npm run lint
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add change.md
git commit -m "docs: log request evidence and alert lifecycle work"
```

---

## Plan self-review (spec coverage)

| Spec requirement | Task |
|---|---|
| Blocks file upload + fileId on Evidence | 2, 3, 6, 7 |
| RequestContext (who / flat / when) | 5 |
| Resident + staff + vendor upload surfaces | 3, 6, 7 |
| Lifecycle notices (verify, closed, assigned) | 7 |
| Inbox link labels not always "Open" | 1, 8 |
| Seed/demo fallback without fileId | 4 |
| DESIGN.md / BRD constraints | Global Constraints |

No placeholders remain. Scope is a single slice — no notifier/SMS, no compression, no Notice schema change.

---

## Execution handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-14-request-evidence-and-alerts.md`.**

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — implement tasks in this session with checkpoints

Which approach do you want?
