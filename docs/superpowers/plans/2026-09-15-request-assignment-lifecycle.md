# Request assignment lifecycle — Implementation plan

> **For agentic workers:** TDD. `lifecycle-check.ts` and `notices-check.ts` must pass before UI. Schema push uses `blocks data sync --dry-run` then `--yes` (account `noor`, project `D975c4874bd6b47b995cce54f926c09cc`). No raw HTTP. No Inter, no purple, money is ৳, no ৳ on vendor confirm.

**Spec:** `docs/superpowers/specs/2026-09-15-request-assignment-lifecycle-design.md`

## Chunk 1 — Pure lifecycle

- Create `src/features/requests/lifecycle.ts` + `lifecycle-check.ts`
- Guards: acknowledge only `submitted`; assign only `acknowledged|assigned|in_progress`; start only `assigned`; confirm only `in_progress`; XOR vendor/staff assignee
- `canAdvanceWork`: staff/admin any job; vendor only matching `vendorId`
- `inHouseStaffPeople`, `parseAssignValue` / `assignValue`
- `npm run check:lifecycle`

## Chunk 2 — Notices

- `Notice.recipientId`; emergency title prefix; assigned role vendor or staff
- `visibleNotices` (admin all; else role match and recipient absent or self)
- Inbox uses `visibleNotices`
- `npm run check:notices`

## Chunk 3 — Store + persistence

- `assignWork`, `startWork`; `markDone` requires `in_progress` + after photo
- Map `staffAssigneeId` / `recipientId` in `building-data.ts`
- Schema JSON fields; `blocks data validate`; `blocks data sync --dry-run` then `--yes`

## Chunk 4 — UI

- Staff: Acknowledge → grouped assign → Start work → Confirm done + photo + ৳
- Vendor: Start work → Confirm done + photo, no cost
- RequestContext shows assignee

## Chunk 5 — Verify

- `npx tsc --noEmit`, lint on touched files, all `check:*` scripts
