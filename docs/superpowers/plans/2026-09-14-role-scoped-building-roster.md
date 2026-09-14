# Role-scoped Building Roster Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show live building facts and registered flats on each role home, scoped by IAM role, after Registration writes them.

**Architecture:** Pure `visibleFlats` / `buildingFactsForRole` in `src/features/building/roster.ts`. One read-only `BuildingRoster` component. Four homes pass already-filtered flats. No new routes, schemas, or writes.

**Tech Stack:** Next.js App Router, existing `BuildingProvider`, assert-based `tsx` checks (no Vitest).

## Global Constraints

- Follow `DESIGN.md`: no Inter, no purple, no colour-only status, money is ৳ via `formatTaka`.
- Semicolons and existing file style in `src/`.
- Isolation is app-level only. No Blocks Data row policies.
- Registration remains the only write surface.
- `npx tsc --noEmit` and `npm run lint` must stay clean.
- Do not edit unrelated dirty files (`BRD.md`, `src/lib/blocks/registry.ts`, etc.).

---

## File map

- Create: `src/features/building/roster.ts` — `uniqueFlatIds`, `visibleFlats`, `buildingFactsForRole`
- Create: `src/features/building/roster-check.ts` — assert-based check
- Create: `src/components/building/building-roster.tsx` — read-only section
- Modify: `src/app/resident/page.tsx` — Your-flat section after title
- Modify: `src/app/staff/page.tsx` — roster after urgent/routine grid
- Modify: `src/app/committee/page.tsx` — pass flats, buildingInfo, role
- Modify: `src/components/committee/desk.tsx` — roster after three columns
- Modify: `src/app/vendor/page.tsx` — roster after jobs
- Modify: `package.json` — `check:roster` script
- Modify: `README.md` — building surfaces table
- Modify: `change.md` — changelog

---

### Task 1: Visibility helpers and check file

**Files:**
- Create: `src/features/building/roster.ts`
- Create: `src/features/building/roster-check.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `Role`, `Flat`, `RequestRecord` from `@/types`; `seedFlats` from `@/data/seed`
- Produces:
  - `uniqueFlatIds(requests: RequestRecord[]): string[]`
  - `visibleFlats(input: { role: Role; actorFlatId?: string; flats: Flat[]; assignedFlatIds: string[] }): Flat[]`
  - `buildingFactsForRole(role: Role): { name: boolean; address: boolean; storeys: boolean; registeredCount: boolean; fee: boolean }`

- [ ] **Step 1: Write the failing check**

Create `src/features/building/roster-check.ts`:

```ts
import { seedFlats } from "@/data/seed"
import { buildingFactsForRole, uniqueFlatIds, visibleFlats } from "@/features/building/roster"
import type { RequestRecord } from "@/types"

const extraFlat = { id: "12-C", label: "12-C", floor: 12, status: "vacant" as const }
const roster = [...seedFlats, extraFlat]
const liftJob = {
  id: "req-7b",
  flatId: "7-B",
  residentId: "nusrat@yopmail.com",
  message: "lift",
  category: "lift",
  urgency: "emergency",
  status: "submitted",
  createdAt: "2026-09-13T08:12:00.000Z",
  evidence: [],
  timeline: []
} satisfies RequestRecord
const pumpJob = { ...liftJob, id: "pump-1", flatId: "common", residentId: "hasan@yopmail.com" }

if (uniqueFlatIds([liftJob, liftJob, pumpJob]).join(",") !== "7-B,common") {
  throw new Error("uniqueFlatIds must keep first-seen order and drop duplicates")
}

const nusrat = visibleFlats({
  role: "resident",
  actorFlatId: "7-B",
  flats: roster,
  assignedFlatIds: []
})
if (nusrat.length !== 1 || nusrat[0]?.label !== "7-B") {
  throw new Error("resident must see only their assigned flat")
}

const unassigned = visibleFlats({
  role: "resident",
  flats: roster,
  assignedFlatIds: ["12-C"]
})
if (unassigned.length !== 0) {
  throw new Error("resident without flatId must see no flats, even if assignedFlatIds is populated")
}

const staff = visibleFlats({
  role: "staff",
  actorFlatId: "7-B",
  flats: roster,
  assignedFlatIds: []
})
if (staff.map((item) => item.label).join(",") !== "10-A,12-C,7-B") {
  throw new Error(`staff must see every flat sorted by label, got ${staff.map((item) => item.label).join(",")}`)
}

for (const role of ["committee", "admin"] as const) {
  const rows = visibleFlats({ role, flats: roster, assignedFlatIds: [] })
  if (rows.length !== 3) {
    throw new Error(`${role} must see every registered flat`)
  }
}

const vendorJobs = visibleFlats({
  role: "vendor",
  flats: seedFlats,
  assignedFlatIds: uniqueFlatIds([liftJob, pumpJob])
})
if (vendorJobs.length !== 2 || vendorJobs[0]?.label !== "7-B" || vendorJobs[1]?.label !== "common") {
  throw new Error("vendor must see job flats and synthesise missing labels")
}
if (vendorJobs[1]?.floor !== 0 || vendorJobs[1]?.status !== "occupied") {
  throw new Error("synthesised common flat must be floor 0 occupied")
}

const idleVendor = visibleFlats({ role: "vendor", flats: roster, assignedFlatIds: [] })
if (idleVendor.length !== 0) {
  throw new Error("vendor with no jobs must see no flats")
}

if (buildingFactsForRole("resident").fee || buildingFactsForRole("vendor").fee) {
  throw new Error("resident and vendor must not see fee")
}
if (buildingFactsForRole("staff").fee || !buildingFactsForRole("staff").storeys) {
  throw new Error("staff must see storeys and not fee")
}
if (!buildingFactsForRole("committee").fee || !buildingFactsForRole("admin").fee) {
  throw new Error("committee and admin must see fee")
}
if (buildingFactsForRole("resident").storeys || buildingFactsForRole("resident").registeredCount) {
  throw new Error("resident must not see storeys or registered count")
}

console.log("roster check ok: role-scoped flats and building facts")
```

- [ ] **Step 2: Run check to verify it fails**

Run: `npx tsx src/features/building/roster-check.ts`

Expected: FAIL with `Cannot find module` / `roster.ts` not defined.

- [ ] **Step 3: Write minimal implementation**

Create `src/features/building/roster.ts`:

```ts
import type { Flat, RequestRecord, Role } from "@/types"

export type BuildingFacts = {
  name: boolean
  address: boolean
  storeys: boolean
  registeredCount: boolean
  fee: boolean
}

export const uniqueFlatIds = (requests: RequestRecord[]): string[] => {
  const seen = new Set<string>()
  const ids: string[] = []
  for (const item of requests) {
    if (!item.flatId || seen.has(item.flatId)) continue
    seen.add(item.flatId)
    ids.push(item.flatId)
  }
  return ids
}

const matchFlat = (flats: Flat[], key: string) => {
  return flats.find((item) => item.id === key || item.label === key)
}

const synthesiseFlat = (id: string): Flat => {
  return { id, label: id, floor: 0, status: "occupied" }
}

export const visibleFlats = ({
  role,
  actorFlatId,
  flats,
  assignedFlatIds
}: {
  role: Role
  actorFlatId?: string
  flats: Flat[]
  assignedFlatIds: string[]
}): Flat[] => {
  switch (role) {
    case "resident": {
      if (!actorFlatId) return []
      const match = matchFlat(flats, actorFlatId)
      return match ? [match] : []
    }
    case "staff":
    case "committee":
    case "admin":
      return [...flats].sort((a, b) => a.label.localeCompare(b.label))
    case "vendor":
      return assignedFlatIds.map((id) => matchFlat(flats, id) ?? synthesiseFlat(id))
    default: {
      const _never: never = role
      return _never
    }
  }
}

export const buildingFactsForRole = (role: Role): BuildingFacts => {
  switch (role) {
    case "resident":
    case "vendor":
      return { name: true, address: true, storeys: false, registeredCount: false, fee: false }
    case "staff":
      return { name: true, address: true, storeys: true, registeredCount: true, fee: false }
    case "committee":
    case "admin":
      return { name: true, address: true, storeys: true, registeredCount: true, fee: true }
    default: {
      const _never: never = role
      return _never
    }
  }
}
```

Add to `package.json` scripts, next to `check:seed`:

```json
"check:roster": "npx tsx src/features/building/roster-check.ts"
```

- [ ] **Step 4: Run check to verify it passes**

Run: `npm run check:roster`

Expected: `roster check ok: role-scoped flats and building facts`

- [ ] **Step 5: Commit**

```bash
git add src/features/building/roster.ts src/features/building/roster-check.ts package.json
git commit -m "feat(building): add role-scoped flat visibility helpers"
```

---

### Task 2: BuildingRoster component

**Files:**
- Create: `src/components/building/building-roster.tsx`

**Interfaces:**
- Consumes: `buildingFactsForRole` from `src/features/building/roster.ts`; `formatTaka`; `EmptyState`; `Role`, `BuildingInfo`, `Flat`
- Produces: `BuildingRoster({ role, buildingInfo, flats })`

- [ ] **Step 1: Write the component**

There is no React test runner. Helper coverage from Task 1 stands. Create `src/components/building/building-roster.tsx`:

```tsx
"use client"

import { motion } from "framer-motion"
import { EmptyState } from "@/components/ui/empty-state"
import { buildingFactsForRole } from "@/features/building/roster"
import { formatTaka } from "@/lib/money"
import { fadeRise, staggerContainer } from "@/lib/motion"
import type { BuildingInfo, Flat, Role } from "@/types"

const headingFor = (role: Role) => {
  switch (role) {
    case "resident":
      return "Your flat"
    case "vendor":
      return "Flats on your jobs"
    case "staff":
    case "committee":
    case "admin":
      return "Flats"
    default: {
      const _never: never = role
      return _never
    }
  }
}

const emptyCopy = (role: Role) => {
  switch (role) {
    case "resident":
      return {
        title: "No flat assigned",
        body: "Ask the committee to register your unit."
      }
    case "vendor":
      return {
        title: "No flats on your jobs",
        body: "When a job is assigned, the unit appears here."
      }
    case "staff":
    case "committee":
    case "admin":
      return {
        title: "No flats yet",
        body: "Register units on Registration."
      }
    default: {
      const _never: never = role
      return _never
    }
  }
}

const occupancyLabel = (status: Flat["status"]) => {
  switch (status) {
    case "occupied":
      return "Occupied"
    case "vacant":
      return "Vacant"
    default: {
      const _never: never = status
      return _never
    }
  }
}

export const BuildingRoster = ({
  role,
  buildingInfo,
  flats
}: {
  role: Role
  buildingInfo: BuildingInfo | null
  flats: Flat[]
}) => {
  const facts = buildingFactsForRole(role)
  const empty = emptyCopy(role)

  return (
    <section className="border border-hairline bg-surface p-4 md:p-6">
      <h2 className="font-display text-xl">{headingFor(role)}</h2>
      {buildingInfo ? (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {facts.name ? (
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Building</dt>
              <dd className="mt-1">{buildingInfo.name}</dd>
            </div>
          ) : null}
          {facts.address ? (
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Address</dt>
              <dd className="mt-1">{buildingInfo.addressLine}</dd>
            </div>
          ) : null}
          {facts.storeys ? (
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Storeys</dt>
              <dd className="mt-1 font-mono">{buildingInfo.storeys}</dd>
            </div>
          ) : null}
          {facts.registeredCount ? (
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Registered flats</dt>
              <dd className="mt-1 font-mono">{flats.length}</dd>
            </div>
          ) : null}
          {facts.fee ? (
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Fee</dt>
              <dd className="mt-1 font-mono">{formatTaka(buildingInfo.fee)}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      {flats.length === 0 ? (
        <div className="mt-4">
          <EmptyState title={empty.title} body={empty.body} />
        </div>
      ) : (
        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-4 space-y-2"
        >
          {flats.map((flat) => (
            <motion.li
              key={flat.id}
              variants={fadeRise}
              className="flex items-center justify-between gap-3 border border-hairline bg-surface-2 px-3 py-2 text-sm"
            >
              <span>{flat.label}</span>
              <span className="text-ink-faint">
                Floor {flat.floor} · {occupancyLabel(flat.status)}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`

Expected: PASS (no errors from the new file).

- [ ] **Step 3: Commit**

```bash
git add src/components/building/building-roster.tsx
git commit -m "feat(building): add read-only building roster section"
```

---

### Task 3: Resident home

**Files:**
- Modify: `src/app/resident/page.tsx`

**Interfaces:**
- Consumes: `visibleFlats` from Task 1; `BuildingRoster` from Task 2; `useBuilding`, `useSessionActor`

- [ ] **Step 1: Mount the roster after the title row**

Replace `src/app/resident/page.tsx` with:

```tsx
"use client"

import Link from "next/link"
import { BuildingRoster } from "@/components/building/building-roster"
import { AppShell } from "@/components/layout/app-shell"
import { RequestCard } from "@/components/requests/request-card"
import { RequestList } from "@/components/requests/request-list"
import { EmptyState } from "@/components/ui/empty-state"
import { uniqueFlatIds, visibleFlats } from "@/features/building/roster"
import { useBuilding, useSessionActor } from "@/lib/store"

const ResidentHome = () => {
  const actor = useSessionActor()
  const { visibleRequests, flats, buildingInfo, session } = useBuilding()
  const mine = visibleRequests()
  const open = mine.filter((item) => item.status !== "verified_closed")
  const closed = mine.filter((item) => item.status === "verified_closed")
  const roster = visibleFlats({
    role: session?.role ?? "resident",
    actorFlatId: actor?.flatId,
    flats,
    assignedFlatIds: uniqueFlatIds(mine)
  })

  return (
    <AppShell allow={["resident"]}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Flat {actor?.flatId}</p>
          <h1 className="font-display text-[32px] leading-tight">Your requests</h1>
        </div>
        <Link
          href="/resident/new"
          className="inline-flex min-h-11 items-center rounded-[8px] bg-courtyard px-4 text-surface"
        >
          New request
        </Link>
      </div>
      <div className="mt-8">
        <BuildingRoster role={session?.role ?? "resident"} buildingInfo={buildingInfo} flats={roster} />
      </div>
      <section className="mt-8">
        {open.length === 0 ? (
          <EmptyState
            title="Nothing open"
            body="When something breaks, write it here. You will see status without calling anyone."
          />
        ) : (
          <RequestList>
            {open.map((item) => (
              <RequestCard key={item.id} request={item} href={`/resident/requests/${item.id}`} />
            ))}
          </RequestList>
        )}
      </section>
      {closed.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-xl">Recently closed</h2>
          <RequestList className="mt-3 opacity-80">
            {closed.map((item) => (
              <RequestCard key={item.id} request={item} href={`/resident/requests/${item.id}`} />
            ))}
          </RequestList>
        </section>
      ) : null}
    </AppShell>
  )
}

export default ResidentHome
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/resident/page.tsx
git commit -m "feat(resident): show assigned flat and building facts on home"
```

---

### Task 4: Staff board

**Files:**
- Modify: `src/app/staff/page.tsx`

**Interfaces:**
- Consumes: `visibleFlats`, `uniqueFlatIds`, `BuildingRoster`

- [ ] **Step 1: Mount roster after the urgent/routine grid**

Replace `src/app/staff/page.tsx` with:

```tsx
"use client"

import { BuildingRoster } from "@/components/building/building-roster"
import { AppShell } from "@/components/layout/app-shell"
import { RequestCard } from "@/components/requests/request-card"
import { RequestList } from "@/components/requests/request-list"
import { EmptyState } from "@/components/ui/empty-state"
import { uniqueFlatIds, visibleFlats } from "@/features/building/roster"
import { groupOpenBoard } from "@/features/requests/board"
import { useBuilding, useSessionActor } from "@/lib/store"

const StaffBoard = () => {
  const actor = useSessionActor()
  const { visibleRequests, flats, buildingInfo, session } = useBuilding()
  const requests = visibleRequests()
  const { emergencies, urgent, routine } = groupOpenBoard(requests)
  const roster = visibleFlats({
    role: session?.role ?? "staff",
    actorFlatId: actor?.flatId,
    flats,
    assignedFlatIds: uniqueFlatIds(requests)
  })

  return (
    <AppShell allow={["staff"]}>
      <h1 className="font-display text-[32px] leading-tight">Board</h1>
      <p className="mt-2 text-ink-soft">Emergencies first. Routine stays quiet.</p>
      <section className="mt-8">
        <h2 className="text-[11px] uppercase tracking-[0.08em] text-terracotta">Emergency</h2>
        {emergencies.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="No emergencies" body="Keep it that way." />
          </div>
        ) : (
          <RequestList className="mt-3">
            {emergencies.map((item) => (
              <RequestCard key={item.id} request={item} href={`/staff/requests/${item.id}`} showMoney />
            ))}
          </RequestList>
        )}
      </section>
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Urgent</h2>
          <RequestList className="mt-3">
            {urgent.map((item) => (
              <RequestCard key={item.id} request={item} href={`/staff/requests/${item.id}`} showMoney />
            ))}
          </RequestList>
        </section>
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Routine</h2>
          <RequestList className="mt-3">
            {routine.map((item) => (
              <RequestCard key={item.id} request={item} href={`/staff/requests/${item.id}`} showMoney />
            ))}
          </RequestList>
        </section>
      </div>
      <div className="mt-10">
        <BuildingRoster role={session?.role ?? "staff"} buildingInfo={buildingInfo} flats={roster} />
      </div>
    </AppShell>
  )
}

export default StaffBoard
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/staff/page.tsx
git commit -m "feat(staff): list registered flats below the board"
```

---

### Task 5: Committee / admin desk

**Files:**
- Modify: `src/app/committee/page.tsx`
- Modify: `src/components/committee/desk.tsx`

**Interfaces:**
- Consumes: `visibleFlats`, `BuildingRoster`
- Desk props gain `flats`, `buildingInfo`, `role`

- [ ] **Step 1: Thread data into the desk**

Replace `src/app/committee/page.tsx` with:

```tsx
"use client"

import { AppShell } from "@/components/layout/app-shell"
import { CommitteeDesk } from "@/components/committee/desk"
import { uniqueFlatIds, visibleFlats } from "@/features/building/roster"
import { useBuilding } from "@/lib/store"

const CommitteePage = () => {
  const { requests, decisions, vendors, flats, buildingInfo, session } = useBuilding()
  const role = session?.role ?? "committee"
  const roster = visibleFlats({
    role,
    flats,
    assignedFlatIds: uniqueFlatIds(requests)
  })

  return (
    <AppShell allow={["committee"]}>
      <CommitteeDesk
        requests={requests}
        vendors={vendors}
        decisions={decisions}
        flats={roster}
        buildingInfo={buildingInfo}
        role={role}
      />
    </AppShell>
  )
}

export default CommitteePage
```

Replace `src/components/committee/desk.tsx` with the existing file plus roster import, extra props, and the section after the three-column grid / before the pump recommendation. Full file:

```tsx
import Link from "next/link"
import { BuildingRoster } from "@/components/building/building-roster"
import { formatTaka } from "@/lib/money"
import { openUrgents, vendorSpend } from "@/features/spend/rollups"
import type { BuildingInfo, Decision, Flat, RequestRecord, Role, Vendor } from "@/types"

type CommitteeDeskProps = {
  requests: RequestRecord[]
  vendors: Vendor[]
  decisions: Decision[]
  flats: Flat[]
  buildingInfo: BuildingInfo | null
  role: Role
}

export const CommitteeDesk = ({
  requests,
  vendors,
  decisions,
  flats,
  buildingInfo,
  role
}: CommitteeDeskProps) => {
  const urgentOpen = openUrgents(requests)
  const billed = vendorSpend(requests, vendors)
  const slow = billed[0]
  const pumpTotal = requests
    .filter((item) => item.equipmentId === "roof-pump")
    .reduce((sum, item) => sum + (item.cost ?? 0), 0)

  return (
    <>
      <h1 className="font-display text-[32px] leading-tight">Desk</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Which vendor is slow, what they cost, and which urgent incidents are open right now.
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="border border-terracotta bg-terracotta-wash p-5">
          <h2 className="text-[11px] uppercase tracking-[0.08em]">Open urgents</h2>
          <p className="mt-3 font-display text-4xl">{urgentOpen.length}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {urgentOpen.map((item) => (
              <li key={item.id}>
                Flat {item.flatId} · {item.urgency}
              </li>
            ))}
          </ul>
        </section>
        <section className="border border-hairline bg-surface p-5">
          <h2 className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Slow / expensive</h2>
          <p className="mt-3 font-display text-2xl">{slow?.vendor.name}</p>
          <p className="mt-2 font-mono text-xl">{formatTaka(slow?.total ?? 0)}</p>
          <p className="mt-2 text-sm text-ink-soft">
            {slow?.count} billed jobs
            {slow?.repeats ? ` · ${slow.repeats} repeats on the same pump` : ""}
          </p>
          <Link
            href={`/committee/vendors/${slow?.vendor.id}`}
            className="mt-4 inline-flex min-h-11 items-center text-courtyard underline-offset-4 hover:underline"
          >
            Vendor history
          </Link>
        </section>
        <section className="border border-hairline bg-surface p-5">
          <h2 className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Spend</h2>
          <ul className="mt-4 space-y-3">
            {billed.map((row) => (
              <li key={row.vendor.id} className="flex justify-between gap-3">
                <span>{row.vendor.name}</span>
                <span className="font-mono">{formatTaka(row.total)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="mt-10">
        <BuildingRoster role={role} buildingInfo={buildingInfo} flats={flats} />
      </div>
      <section className="mt-10 bg-warning-wash p-5">
        <p className="text-[11px] uppercase tracking-[0.08em]">Replace recommendation</p>
        <h2 className="mt-2 font-display text-2xl">Roof pump</h2>
        <p className="mt-2 max-w-2xl">
          Six repairs in five months totaling {formatTaka(pumpTotal)} from Rahman Pump Service.
          Another patch is cheaper this month and more expensive this year.
        </p>
        {decisions.map((decision) => (
          <p key={decision.id} className="mt-4 border-l-2 border-warning pl-3">
            Recorded decision: {decision.body}
          </p>
        ))}
      </section>
    </>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/committee/page.tsx src/components/committee/desk.tsx
git commit -m "feat(committee): show building facts and all flats on the desk"
```

---

### Task 6: Vendor home

**Files:**
- Modify: `src/app/vendor/page.tsx`

**Interfaces:**
- Consumes: `visibleFlats` with `assignedFlatIds` from `visibleRequests()`; `BuildingRoster`

- [ ] **Step 1: Mount roster after jobs**

Replace `src/app/vendor/page.tsx` with:

```tsx
"use client"

import { BuildingRoster } from "@/components/building/building-roster"
import { AppShell } from "@/components/layout/app-shell"
import { RequestCard } from "@/components/requests/request-card"
import { RequestList } from "@/components/requests/request-list"
import { EmptyState } from "@/components/ui/empty-state"
import { uniqueFlatIds, visibleFlats } from "@/features/building/roster"
import { useBuilding, useSessionActor } from "@/lib/store"

const VendorHome = () => {
  const actor = useSessionActor()
  const { visibleRequests, flats, buildingInfo, session } = useBuilding()
  const jobs = visibleRequests()
  const roster = visibleFlats({
    role: session?.role ?? "vendor",
    actorFlatId: actor?.flatId,
    flats,
    assignedFlatIds: uniqueFlatIds(jobs)
  })

  return (
    <AppShell allow={["vendor"]}>
      <h1 className="font-display text-[32px] leading-tight">Assigned jobs</h1>
      <p className="mt-2 text-ink-soft">Only your work. No other vendors. No building finances.</p>
      {jobs.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No jobs" body="When Hasan assigns you, the brief appears here." />
        </div>
      ) : (
        <RequestList className="mt-6">
          {jobs.map((item) => (
            <RequestCard key={item.id} request={item} href={`/vendor/jobs/${item.id}`} />
          ))}
        </RequestList>
      )}
      <div className="mt-10">
        <BuildingRoster role={session?.role ?? "vendor"} buildingInfo={buildingInfo} flats={roster} />
      </div>
    </AppShell>
  )
}

export default VendorHome
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/vendor/page.tsx
git commit -m "feat(vendor): list flats that appear on assigned jobs"
```

---

### Task 7: Docs, changelog, final checks

**Files:**
- Modify: `README.md`
- Modify: `change.md`

- [ ] **Step 1: Update README building table**

In `README.md`, replace the Resident home row and insert staff/committee/vendor rows so the table becomes:

```markdown
| Surface | URL | Viewer | What they see |
|---------|-----|--------|---------------|
| Signed-out landing | `/` | Anonymous visitor | Hardcoded civic notice board (`FALLBACK_BUILDING.name` → "BashaCare", address stamp "House 18 · Road 7 · Uttara"). No live `Building` row until sign-in. |
| Desk header | All signed-in routes | Every desk role | `buildingInfo.name` from the `Building` schema (fallback "Uttara Heights"). Subtitle next to the BashaCare wordmark. |
| Registration — Building panel | `/committee/registry` | **Admin**, **Committee** | Full building record: name, address, storeys, flat count, maintenance fee (৳). Editable and saved to Blocks Data. |
| Resident home | `/resident` | **Resident** | Your-flat section: building name + address, assigned unit only (label, floor, occupancy). No fee. No other flats. |
| Staff board | `/staff` | **Staff**, **Admin** | Flats section below routine: name, address, storeys, live registered count, every flat. No fee. |
| Committee desk | `/committee` | **Committee**, **Admin** | Flats section after the three columns: name, address, storeys, live registered count, fee (৳), every flat. |
| Vendor jobs | `/vendor` | **Vendor** | Flats on your jobs: building name + address, units that appear on assigned jobs only. No fee. |
| Account | `/account` | Every desk role | Profile only; copy references Registration for flat/vendor changes. |
```

Also add under **Data isolation checks**:

```markdown
- Resident roster shows only the assigned flat; staff/committee/admin see every registered flat; vendor sees only flats on assigned jobs.
- Maintenance fee (৳) appears on committee/admin Desk roster only — never resident, vendor, or staff Board.
```

- [ ] **Step 2: Changelog**

Prepend under `## [Unreleased]` in `change.md`:

```markdown
- Show live building facts and registered flats on each role home, scoped by IAM role (2026-09-14)
```

- [ ] **Step 3: Run checks**

Run:

```bash
npm run check:roster
npm run check:seed
npx tsc --noEmit
npm run lint
```

Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add README.md change.md
git commit -m "docs: describe role-scoped building roster on each desk"
```

---

## Self-review

1. **Spec coverage:** `visibleFlats` rules, facts table, component, four placements, isolation, tests, `check:roster`, README — each has a task.
2. **Placeholders:** none.
3. **Types:** `BuildingRoster` props match Task 2; desk extras match Task 5; helper signatures match Task 1 and the spec.
