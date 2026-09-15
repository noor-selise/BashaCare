# Request assignment lifecycle — Design

**Status:** Approved for implementation
**Date:** 2026-09-15
**Relates to:** `BashaCare.pdf` (staff assign vendor or in-house; resident watches status; verify before close; vendors see only own work; emergency louder notify); `BRD.md` FR-3.2, FR-4, FR-1.4, §3 in-app notices

## 1. Problem

The status rail shows Submitted → Acknowledged → Assigned → In progress → Awaiting verification → Verified closed, but the desk does not walk that path:

- Assign is allowed from Submitted (skips Acknowledged).
- There is no Start work; **In progress** only appears when a resident rejects verification.
- Mark done is allowed from almost any open status (skips Assigned and In progress).
- Assign-to-vendor alerts use `Notice.role = vendor`, so **every** vendor sees them, not the assignee.
- Assignment is vendor-only; PDF/BRD require vendor **or in-house staff**.
- Vendor job page collects ৳, which the PDF hides from vendors.

## 2. Decisions

- Strict rail: Acknowledge before Assign; Start work before Confirm done.
- Assignee is a **vendor** or **in-house staff** (`demoRoleFromEmail === "staff"`, e.g. Hasan). Not committee, not admin, not residents.
- After Assigned, **Start work** and **Confirm done** may be used by the assignee **or any staff/admin**. Vendors may use them only on jobs where `request.vendorId` matches their `Person.vendorId`.
- Notices stay in-app (`Notice` schema). Target the assignee with `recipientId`.
- Vendor confirm-done: after photo only. Cost stays on staff/admin triage.
- Emergency assigned alerts prefix title with `Emergency ·`.
- No SMS/WhatsApp. No Blocks `notifier` in this slice. No committee override-close.

## 3. Architecture

Pure `src/features/requests/lifecycle.ts` owns legal transitions. `BuildingProvider` calls it; pages only render the next legal action.

### 3.1 Transitions

| From | Action | To | Who |
|---|---|---|---|
| submitted | Acknowledge | acknowledged | staff, admin |
| acknowledged, assigned, in_progress | Assign (vendor xor staff) | assigned | staff, admin |
| assigned | Start work | in_progress | assignee, or any staff/admin |
| in_progress | Confirm done | awaiting_verification | same as Start work |
| awaiting_verification | Verify | verified_closed | owning resident |
| awaiting_verification | Not done | in_progress | owning resident |

Not done clears `completedAt`, keeps assignment and evidence history, and requires a **new** after photo before Confirm done. Staff get an inbox alert; if a vendor is assigned they get one too. The resident’s verify alert is marked read. Illegal transitions no-op (no write, no notice).

### 3.2 Data

- `Request.staffAssigneeId?: string` (Person email). Exactly one of `vendorId` / `staffAssigneeId` after assign. The other is cleared.
- `Notice.recipientId?: string`. Inbox: admin sees all; others see `role` match **and** (`recipientId` absent **or** equals their Person email/id).

### 3.3 Notices

| Event | role | recipientId | Title |
|---|---|---|---|
| submitted | staff | (none — all staff) | `New request · Flat {id}` / emergency: `Emergency · New request · Flat {id}` |
| assigned vendor | vendor | that vendor’s Person email | `New job · Flat {id}` (emergency prefix) |
| assigned staff | staff | that staff email | `New job · Flat {id}` (emergency prefix) |
| ready_to_verify | resident | request.residentId | existing verify copy |
| not_done | staff | (none — all staff) | `Work not done · Flat {id}` (emergency prefix) |
| not_done | vendor | that vendor’s Person email, if assigned | same title |
| verified_closed | resident | request.residentId | existing closed copy |

Start work: timeline only.

### 3.4 UI

- Staff triage: Acknowledge (submitted) → grouped select Vendors / In-house staff + Assign → Start work (assigned) → Confirm done + after photo + ৳ (in_progress). After Not done, a banner tells staff to continue and attach a new after photo.
- Vendor job: Start work (assigned) → Confirm done + after photo (in_progress). No cost field. Same Not done banner.
- Resident: Verify / Not done while awaiting verification; after Not done they watch In progress until asked to verify again.
- Status rail unchanged.

### 3.5 Non-goals

SMS, Notifier service, Data row policies, committee close override, assigning committee/admin/residents.

## 4. Testing

`src/features/requests/lifecycle-check.ts` + `src/lib/notices-check.ts` recipient filter. `tsc --noEmit` and lint on touched files clean.
