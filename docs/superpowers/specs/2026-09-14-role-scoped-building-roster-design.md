# Role-scoped building roster — Design

**Status:** Approved for planning
**Date:** 2026-09-14
**Relates to:** `BRD.md` FR-1.2 (residents see only their flat), FR-1.3 (finances hidden from resident/vendor), FR-1.4 (vendors see assigned work only); `docs/superpowers/specs/2026-09-14-building-registration-design.md` (Registration writes `Building` / `Flat`; this spec is the read surface)

## 1. Problem

Admin and committee can save building details and add flats on `/committee/registry`. Those rows persist in Blocks Data and in `BuildingProvider` state, but the four role homes never list them. The header subtitle shows `buildingInfo.name`. Resident home shows `actor.flatId` as a kicker. Staff Board, Committee Desk, and Vendor Jobs are request lists only.

A newly added flat (for example `12-C`) is therefore invisible to every desk except Registration until someone files a request against it. That is the gap.

## 2. Decisions (from brainstorming)

- Each role home gets a **read-only** building/flats section. No new route. No new nav item.
- Tapping a flat does nothing. No filter, no flat-detail page. Registration remains the only write surface.
- Resident sees **their assigned unit only**, never the building roster (FR-1.2).
- Staff, committee, and admin see **every registered flat**.
- Vendor sees **flats that appear on their assigned jobs** only (FR-1.4).
- Maintenance fee (৳) is visible to **committee and admin only** (FR-1.3). Staff see name, address, storeys, and registered count — not money. Resident and vendor never see the fee.
- Isolation stays **app-level**, same as `visibleRequests()`. No Blocks Data row policies in this slice (still the BRD’s deferred next step).
- Signed-out landing `/` stays civic copy. Out of scope.
- Occupancy editing is out of scope. Show `occupied` / `vacant` as text, never colour-only.
- Click-to-filter and extra routes are out of scope.

## 3. Architecture

Role truth stays in IAM. Flat identity stays the **label** (`7-B`), matching `Person.flatId` and `Request.flatId`. No schema changes. No new Blocks collections.

### 3.1 Visibility helper

New pure module `src/features/building/roster.ts` (testable without React):

```ts
visibleFlats(input: {
  role: Role
  actorFlatId?: string
  flats: Flat[]
  assignedFlatIds: string[]  // unique Request.flatId from the caller’s visibleRequests()
}): Flat[]
```

Rules, in order:

| Role | Result |
|---|---|
| `resident` | The `Flat` whose `id` or `label` equals `actorFlatId` (case-sensitive, labels are stored as entered). If `actorFlatId` is missing, or no row matches, return `[]` — never the full roster. |
| `staff`, `committee`, `admin` | All `flats`, stable-sorted by `label`. |
| `vendor` | One row per id in `assignedFlatIds`. Prefer the matching `Flat` record; if a job’s `flatId` has no row (seed `common` pump jobs), synthesise `{ id, label: id, floor: 0, status: "occupied" }`. Preserve `assignedFlatIds` order. Empty jobs → `[]`. |

`assignedFlatIds` is the caller’s job. Pages pass unique `flatId`s from `visibleRequests()`. The helper does not read the store.

### 3.2 Building facts by role

```ts
buildingFactsForRole(role: Role): {
  name: boolean
  address: boolean
  storeys: boolean
  registeredCount: boolean
  fee: boolean
}
```

| Field | resident | vendor | staff | committee | admin |
|---|---|---|---|---|---|
| name | yes | yes | yes | yes | yes |
| address | yes | yes | yes | yes | yes |
| storeys | no | no | yes | yes | yes |
| registeredCount (`flats.length`, not `buildingInfo.flatCount`) | no | no | yes | yes | yes |
| fee | no | no | no | yes | yes |

`registeredCount` uses the live roster length so adding `12-C` increments the number staff/committee/admin see. Do not display the capacity field `buildingInfo.flatCount` on these sections — that stays on Registration.

Fee, when shown, uses `formatTaka(buildingInfo.fee)` (৳, en-BD grouping).

### 3.3 UI component

New `src/components/building/building-roster.tsx`.

Props: `role`, `buildingInfo`, `flats`. The component calls `buildingFactsForRole(role)` internally. It does not fetch.

Layout (existing tokens only: `border-hairline`, `bg-surface`, `font-display`, label `text-[11px] uppercase tracking-[0.08em] text-ink-faint`):

1. Section heading, role-specific:
   - resident: `Your flat`
   - vendor: `Flats on your jobs`
   - staff / committee / admin: `Flats`
2. Building facts as a `<dl>` of only the allowed fields. Skip a field when `buildingInfo` is null.
3. Flat list as `<ul>`. Each row: label left; `Floor {n}` and occupancy (`Occupied` / `Vacant`) right. Occupancy is text, not colour-only. Rows are not links and have no `onClick`.
4. Empty list uses existing `EmptyState`:
   - resident: title `No flat assigned`, body `Ask the committee to register your unit.`
   - vendor: title `No flats on your jobs`, body `When a job is assigned, the unit appears here.`
   - staff / committee / admin: title `No flats yet`, body `Register units on Registration.`

Placement — **after** the page’s 80% content, except resident (context before their requests):

| Home | File | Placement |
|---|---|---|
| Resident | `src/app/resident/page.tsx` | After the title row, before open requests |
| Staff | `src/app/staff/page.tsx` | After the urgent/routine grid (never above Emergency) |
| Committee + admin | `src/components/committee/desk.tsx` | After the three columns, before the roof-pump recommendation |
| Vendor | `src/app/vendor/page.tsx` | After the jobs list (or after the jobs empty state) |

Committee Desk currently does not receive `flats` / `buildingInfo` / `session.role`. Thread them in from `src/app/committee/page.tsx` via `useBuilding()`. Admin lands on `/committee` (`roleHome`); the same Desk section covers them. `role` for facts and copy is `session.role` (admin vs committee changes fee visibility).

Staff Board `AppShell` stays `allow={["staff"]}` (admin already passes). Do not widen it in this slice.

### 3.4 Data flow

No new writes. `addFlat` / `updateBuildingInfo` already update `BuildingProvider` state. Roster reads `flats` and `buildingInfo` from `useBuilding()`.

A newly added `12-C`:

- appears immediately on staff Board and committee/admin Desk
- appears on a resident home only when that person’s `Person.flatId` is `12-C`
- appears on a vendor home only after a request assigned to that vendor has `flatId: "12-C"`

### 3.5 Isolation and security

- Resident with no `flatId`: empty Your-flat section. Never render other units.
- Vendor: derive ids from `visibleRequests()` only. Do not pass the full `flats` array into the helper as the result set.
- Fee must not appear in resident or vendor DOM (no visually-hidden fee node).
- Still no server-side Data policies. Same trust boundary as today’s request lists.

### 3.6 Non-goals

- Signed-out landing live building data
- Occupancy editor, vacant/occupied toggles
- Click-to-filter request lists
- New routes or nav items
- Blocks Data row-level access policies
- Changing Registration panels
- Showing `buildingInfo.flatCount` (capacity) on role homes — live roster length only

## 4. Testing

Assert-based check file `src/features/building/roster-check.ts`, run with `npx tsx`, matching `src/data/seed-check.ts` / `src/lib/notices-check.ts`. Cover:

- resident with `7-B` → only that flat
- resident with no `flatId` → `[]`
- resident must not receive another unit when the full roster is passed in
- staff / committee / admin → all flats, sorted by label
- vendor with jobs on `7-B` and `common` → those two, `common` synthesised if missing from `flats`
- vendor with no jobs → `[]`
- `buildingFactsForRole("resident")` and `("vendor")` have `fee: false`
- `buildingFactsForRole("staff")` has `fee: false`, `storeys: true`
- `buildingFactsForRole("committee")` and `("admin")` have `fee: true`

Manual: add `12-C` on Registration → staff and committee lists include it; Nusrat (`7-B`) does not; Rafiq does not until a metro-lift job uses `12-C`. Confirm ৳ absent from resident and vendor roster.

`npx tsc --noEmit` and `npm run lint` clean. Scripted FR-7 still works.

Add `check:roster` to `package.json` next to `check:seed`.
