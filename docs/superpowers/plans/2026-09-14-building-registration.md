# Building & Flat Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace BashaCare's hardcoded building/roster (`BUILDING` constant, `people[]` array in `src/data/directory.ts`) with real Blocks Data (`Building`, `Flat`, `Person` schemas) and an admin/committee registration + invite screen, while keeping Blocks IAM as the sole source of role authorization and keeping the existing scripted demo working via migrated seed data.

**Architecture:** Three new Blocks Data schemas (`Building`, `Flat`, `Person`) are loaded and seeded the same way `Request`/`Vendor`/`Decision`/`Notice` already are, in `src/lib/blocks/building-data.ts`. `Person` is profile-only (name/title/flat/vendor link) — it never stores role. Role continues to resolve from Blocks IAM claims via the existing `deskRoleFromSlugs`. A new `/committee/registry` screen lets admin/committee edit the Building record, add Flats, add Vendors, and invite People — invites call `blocksClient.iam.users.create` + `updateAccess` (real IAM) and then write the `Person` row.

**Tech Stack:** Next.js 16 (App Router) + React 19, `@seliseblocks/client` SDK, Tailwind v4, `framer-motion` (already added), `blocks` CLI for schema/rules changes.

**Spec:** `docs/superpowers/specs/2026-09-14-building-registration-design.md`

## Global Constraints

- Role authorization always resolves from Blocks IAM claims (`deskRoleFromSlugs`) — `Person`/`Flat`/`Building` Data records never carry a `role` field. (Spec §3)
- Registration/invite is admin/committee only — no public signup surface anywhere in this plan. (Spec §2)
- No new Blocks Data access policy in this slice — app-level filtering stays as-is (`blocks/data/rules.json` stays `{"policies": []}`). (Spec §3.5)
- Never define platform-managed system fields (`ItemId`, `CreatedDate`, `CreatedBy`, `LastUpdatedDate`, `LastUpdatedBy`, `Language`, `OrganizationId`, `Tags`) in any schema JSON — Blocks adds these automatically.
- Every `blocks data schema push` / `blocks data rules deploy` / `blocks data reload` / `blocks iam users create` / `blocks iam users access grant` (CLI) or `blocksClient.iam.users.create` / `updateAccess` (SDK, run for real against the live tenant, not as app code being written) is a mutation against the live tenant `D975c4874bd6b47b995cce54f926c09cc`. Always dry-run first, show the user the exact change, and get explicit go-ahead before the real call — every time, per the `blocks-data-gateway-configuration` and `blocks-iam-users` skills. Writing the *app code* that calls `blocksClient.iam.users.create`/`updateAccess` behind an admin's own "Invite" button is fine without per-line approval (the real user triggers it at runtime); only literally invoking those calls yourself (CLI or a manual script) needs the explicit go-ahead.
- This repo has no automated test framework (no jest/vitest/playwright in `package.json`). "Tests" in this plan mean: `npx tsc --noEmit`, `npm run lint`, small deterministic `tsx`-run assertion scripts matching the existing `src/data/seed-check.ts` pattern for pure data/logic, and manual dev-server smoke checks for UI — matching how this repo already verifies itself. Do not add a test framework as part of this plan; that's out of scope.
- Blocks Data row-mapping follows the existing convention in `src/lib/blocks/building-data.ts`: a `Row` type with optional fields, a `fromRow` function that coerces with `String()`/`typeof` guards, `rowId()` for the item id, `listItems(response, "get<Plural>")` for unwrapping list responses.
- New schema collection names follow the existing `blx_<PluralSchemaName>` convention (see `blx_Vendors`, `blx_Requests`).

---

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `src/types/index.ts` | Modify | Add `BuildingInfo`, `Flat`, `Person`; remove unused `Actor` |
| `src/data/seed.ts` | Modify | Add `seedCast`, `seedPeople`, `seedFlats`, `seedBuildingInfo` |
| `src/data/seed-check.ts` | Modify | Assert the new seed data's shape/counts |
| `src/data/directory.ts` | Modify | Drop `BUILDING`/`people[]`; `findPerson`/`personFromEmail` take a `Person[]` param; add `demoRoleFromEmail`; add `FALLBACK_BUILDING` |
| `blocks/data/schemas/Building.json` | Create | New Data schema |
| `blocks/data/schemas/Flat.json` | Create | New Data schema |
| `blocks/data/schemas/Person.json` | Create | New Data schema |
| `src/lib/blocks/building-data.ts` | Modify | Row mapping + load/seed/save for Building/Flat/Person |
| `src/lib/blocks/registry.ts` | Create | `invitePerson()` (IAM create + updateAccess + Person row), `listAccessStatus()` |
| `src/lib/store.tsx` | Modify | New state (`buildingInfo`, `flats`, `people`), new actions (`addFlat`, `updateBuildingInfo`, `invitePerson`), role resolution via `demoRoleFromEmail` |
| `src/lib/session/role-home.ts` | Modify | Swap `personFromEmail(email)?.role` fallback for `demoRoleFromEmail(email)` |
| `src/app/page.tsx`, `src/app/login/page.tsx`, `src/app/login/callback/page.tsx` | Modify | Same fallback swap at call sites |
| `src/components/layout/site-header.tsx` | Modify | Dynamic building name; nav link to Registry for committee/admin |
| `src/app/committee/registry/page.tsx` | Create | The registration screen (gated `allow={["committee"]}`) |
| `src/components/registry/building-panel.tsx` | Create | Edit Building info |
| `src/components/registry/flats-panel.tsx` | Create | List + add Flat |
| `src/components/registry/people-panel.tsx` | Create | List + invite Person |
| `src/components/registry/vendors-panel.tsx` | Create | List + add Vendor |

---

### Task 1: Types

**Files:**
- Modify: `src/types/index.ts`
- Test: `src/data/registry-check.ts` (new, `tsx`-run assertion script)

**Interfaces:**
- Produces: `BuildingInfo { id?: string; name: string; addressLine: string; storeys: number; flatCount: number; fee: number }`, `Flat { id: string; label: string; floor: number; status: "occupied" | "vacant" }`, `Person { id: string; email: string; name: string; title: string; flatId?: string; vendorId?: string }`

- [ ] **Step 1: Add the new types, remove `Actor`**

In `src/types/index.ts`, replace the `Actor` type block:

```ts
export type Actor = {
  id: string
  name: string
  role: Role
  flatId?: string
  vendorId?: string
  title: string
}
```

with:

```ts
export type Person = {
  id: string
  email: string
  name: string
  title: string
  flatId?: string
  vendorId?: string
}

export type Flat = {
  id: string
  label: string
  floor: number
  status: "occupied" | "vacant"
}

export type BuildingInfo = {
  id?: string
  name: string
  addressLine: string
  storeys: number
  flatCount: number
  fee: number
}
```

- [ ] **Step 2: Verify nothing outside `directory.ts` referenced `Actor`**

Run: `grep -rn "\bActor\b" src`
Expected: only `src/data/directory.ts` (fixed in Task 4) — no other matches.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: errors only in `src/data/directory.ts` (still using the old `Actor`/`people`/`BUILDING` shape) — that's fixed in Task 4. If errors appear anywhere else, stop and investigate before continuing.

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(types): add Person/Flat/BuildingInfo, drop unused Actor"
```

---

### Task 2: Seed data

**Files:**
- Modify: `src/data/seed.ts`
- Modify: `src/data/seed-check.ts`

**Interfaces:**
- Consumes: `Person`, `Flat`, `BuildingInfo`, `Role` from `@/types` (Task 1)
- Produces: `seedCast: (Person & { role: Role })[]`, `seedPeople: Person[]`, `seedFlats: Flat[]`, `seedBuildingInfo: BuildingInfo`

- [ ] **Step 1: Add the seed literals**

In `src/data/seed.ts`, change the import line to:

```ts
import type { BuildingInfo, Decision, Flat, Notice, Person, RequestRecord, Role } from "@/types"
```

Append at the end of the file (after `seedNotices`):

```ts
export const seedCast: (Person & { role: Role })[] = [
  { id: "noor@yopmail.com", email: "noor@yopmail.com", name: "Noor Mohammad", role: "admin", title: "Admin" },
  {
    id: "nusrat@yopmail.com",
    email: "nusrat@yopmail.com",
    name: "Nusrat Rahman",
    role: "resident",
    flatId: "7-B",
    title: "Flat 7-B"
  },
  {
    id: "karim@yopmail.com",
    email: "karim@yopmail.com",
    name: "Karim Hossain",
    role: "resident",
    flatId: "10-A",
    title: "Flat 10-A"
  },
  { id: "hasan@yopmail.com", email: "hasan@yopmail.com", name: "Hasan Mia", role: "staff", title: "Caretaker" },
  {
    id: "rina@yopmail.com",
    email: "rina@yopmail.com",
    name: "Rina Chowdhury",
    role: "committee",
    title: "Treasurer"
  },
  {
    id: "rafiq@yopmail.com",
    email: "rafiq@yopmail.com",
    name: "Rafiq Uddin",
    role: "vendor",
    vendorId: "metro-lift",
    title: "Metro Lift AMC"
  },
  {
    id: "rahman@yopmail.com",
    email: "rahman@yopmail.com",
    name: "Abdur Rahman",
    role: "vendor",
    vendorId: "rahman-pump",
    title: "Rahman Pump Service"
  }
]

export const seedPeople: Person[] = seedCast.map((item) => ({
  id: item.id,
  email: item.email,
  name: item.name,
  title: item.title,
  flatId: item.flatId,
  vendorId: item.vendorId
}))

export const seedFlats: Flat[] = [
  { id: "7-B", label: "7-B", floor: 7, status: "occupied" },
  { id: "10-A", label: "10-A", floor: 10, status: "occupied" }
]

export const seedBuildingInfo: BuildingInfo = {
  name: "Uttara Heights",
  addressLine: "House 18, Road 7, Uttara",
  storeys: 12,
  flatCount: 48,
  fee: 2500
}
```

- [ ] **Step 2: Extend the seed-check assertion script**

Append to `src/data/seed-check.ts` (after the existing checks, before the final `console.log`):

```ts
import { seedBuildingInfo, seedCast, seedFlats, seedPeople } from "./seed"

if (seedCast.length !== 7) {
  throw new Error(`expected 7 seed cast members, got ${seedCast.length}`)
}

if (seedPeople.length !== seedCast.length) {
  throw new Error("seedPeople must mirror seedCast 1:1")
}

if (seedPeople.some((person) => "role" in person)) {
  throw new Error("seedPeople rows must not carry a role field — role comes from IAM")
}

if (seedFlats.length !== 2 || !seedFlats.some((f) => f.label === "7-B") || !seedFlats.some((f) => f.label === "10-A")) {
  throw new Error("expected seed flats 7-B and 10-A")
}

if (seedBuildingInfo.name !== "Uttara Heights" || seedBuildingInfo.flatCount !== 48) {
  throw new Error("seed building info drifted from the BRD assumptions")
}
```

Move the `import { PUMP_TOTAL, seedRequests } from "./seed"` line and this new import to the top of the file together (both are `import` statements — TypeScript/ESLint will flag a mid-file `import`). The file should start:

```ts
import { PUMP_TOTAL, seedBuildingInfo, seedCast, seedFlats, seedPeople, seedRequests } from "./seed"
```

and the new checks (without their own `import` line) go after the existing ones, before `console.log`.

- [ ] **Step 3: Run the check script**

Run: `npx tsx src/data/seed-check.ts`
Expected: prints `seed check ok: 6 pump jobs, ৳38,500, open emergency present` with no thrown error (the new assertions ran silently since they only throw on failure).

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: same pre-existing `src/data/directory.ts` errors as Task 1 (fixed next task), nothing new.

- [ ] **Step 5: Commit**

```bash
git add src/data/seed.ts src/data/seed-check.ts
git commit -m "feat(seed): add seed cast, flats, and building info"
```

---

### Task 3: Directory helpers

**Files:**
- Modify: `src/data/directory.ts`
- Modify: `src/lib/session/role-home.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/login/callback/page.tsx`

**Interfaces:**
- Consumes: `seedCast` (Task 2)
- Produces: `findPerson(id: string, people: Person[]): Person`, `personFromEmail(email, people: Person[]): Person | null`, `demoRoleFromEmail(email?: string | null): Role | null`, `FALLBACK_BUILDING: { name: string; line: string }`

- [ ] **Step 1: Rewrite `directory.ts`**

Replace the whole file with:

```ts
import type { Person, Role, Vendor } from "@/types"
import { seedCast } from "@/data/seed"

export const FALLBACK_BUILDING = {
  name: "BashaCare",
  line: "Sign in to see your building"
}

export const vendors: Vendor[] = [
  { id: "metro-lift", name: "Metro Lift AMC", trade: "Lift" },
  { id: "rahman-pump", name: "Rahman Pump Service", trade: "Water / pump" },
  { id: "uttara-electric", name: "Uttara Electric", trade: "Electrical" }
]

export const findPerson = (id: string, people: Person[]): Person => {
  return (
    people.find((item) => item.id === id) ?? {
      id,
      email: id,
      name: "Desk",
      title: "System"
    }
  )
}

export const findVendor = (id: string, list: Vendor[] = vendors) => {
  return list.find((item) => item.id === id)
}

export const personFromEmail = (email: string | undefined | null, people: Person[]): Person | null => {
  if (!email) return null
  return people.find((item) => item.email.toLowerCase() === email.toLowerCase()) ?? null
}

export const demoRoleFromEmail = (email?: string | null): Role | null => {
  if (!email) return null
  const match = seedCast.find((item) => item.email.toLowerCase() === email.toLowerCase())
  return match?.role ?? null
}

export const roleSlugsFromUnknown = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string")
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap((entry) => {
      return Array.isArray(entry) ? entry.filter((item): item is string => typeof item === "string") : []
    })
  }
  return []
}

export const deskRoleFromSlugs = (slugs: string[]): Role | null => {
  if (slugs.includes("admin")) return "admin"
  if (slugs.includes("committee")) return "committee"
  if (slugs.includes("staff")) return "staff"
  if (slugs.includes("vendor")) return "vendor"
  if (slugs.includes("resident")) return "resident"
  return null
}
```

- [ ] **Step 2: Update `role-home.ts`**

In `src/lib/session/role-home.ts`, change:

```ts
import { deskRoleFromSlugs, personFromEmail } from "@/data/directory"
```

to:

```ts
import { deskRoleFromSlugs, demoRoleFromEmail } from "@/data/directory"
```

and change:

```ts
export const deskPathFromAuth = (roles: string[], email?: string | null) => {
  const role = deskRoleFromSlugs(roles) ?? personFromEmail(email)?.role ?? null
  return role ? roleHome(role) : null
}
```

to:

```ts
export const deskPathFromAuth = (roles: string[], email?: string | null) => {
  const role = deskRoleFromSlugs(roles) ?? demoRoleFromEmail(email)
  return role ? roleHome(role) : null
}
```

- [ ] **Step 3: Update the three call sites' imports of `BUILDING`**

In `src/app/page.tsx`, replace:

```ts
import { BUILDING } from "@/data/directory"
```

with:

```ts
import { FALLBACK_BUILDING } from "@/data/directory"
```

and replace every `BUILDING.name` / `BUILDING.line` reference in that file's pre-auth hero (the `<h1>{BUILDING.name}</h1>` and the `<p>{BUILDING.line}</p>`) with `FALLBACK_BUILDING.name` / `FALLBACK_BUILDING.line`. `src/app/login/page.tsx` and `src/app/login/callback/page.tsx` only import `deskPathFromAuth`, not `BUILDING` — no change needed there beyond what `role-home.ts` already fixed underneath them.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: new errors in `src/lib/store.tsx` (`personFromEmail`/`findPerson` now require a second argument, `people` import no longer exists) — that's Task 6. No errors should remain in `directory.ts`, `role-home.ts`, or `page.tsx`.

- [ ] **Step 5: Commit**

```bash
git add src/data/directory.ts src/lib/session/role-home.ts src/app/page.tsx
git commit -m "feat(directory): replace hardcoded roster with Person-list lookups"
```

---

### Task 4: Blocks Data schemas

**Files:**
- Create: `blocks/data/schemas/Building.json`
- Create: `blocks/data/schemas/Flat.json`
- Create: `blocks/data/schemas/Person.json`

**Interfaces:**
- Produces: live `Building`, `Flat`, `Person` collections on tenant `D975c4874bd6b47b995cce54f926c09cc` (`blx_Buildings`, `blx_Flats`, `blx_Persons`)

- [ ] **Step 1: Probe current state**

Run: `blocks data schema pull --json`
Expected: pulls the four existing schemas (`Request`, `Vendor`, `Decision`, `Notice`) into `blocks/data/schemas/` with no unexpected diffs against what's already in the repo. If it shows drift, stop and reconcile before continuing (someone changed schemas outside this repo).

- [ ] **Step 2: Write `Building.json`**

```json
{
  "schemaName": "Building",
  "collectionName": "blx_Buildings",
  "schemaType": 1,
  "fields": [
    {
      "name": "name",
      "type": "String",
      "isArray": false,
      "isPIIData": false,
      "isUniqueData": false,
      "description": "Building display name"
    },
    {
      "name": "addressLine",
      "type": "String",
      "isArray": false,
      "isPIIData": false,
      "isUniqueData": false,
      "description": "Street address"
    },
    {
      "name": "storeys",
      "type": "Float",
      "isArray": false,
      "isPIIData": false,
      "isUniqueData": false,
      "description": "Number of storeys"
    },
    {
      "name": "flatCount",
      "type": "Float",
      "isArray": false,
      "isPIIData": false,
      "isUniqueData": false,
      "description": "Total registered flat capacity"
    },
    {
      "name": "fee",
      "type": "Float",
      "isArray": false,
      "isPIIData": false,
      "isUniqueData": false,
      "description": "Monthly maintenance fee in BDT"
    }
  ]
}
```

- [ ] **Step 3: Write `Flat.json`**

```json
{
  "schemaName": "Flat",
  "collectionName": "blx_Flats",
  "schemaType": 1,
  "fields": [
    {
      "name": "label",
      "type": "String",
      "isArray": false,
      "isPIIData": false,
      "isUniqueData": true,
      "description": "Flat label such as 7-B"
    },
    {
      "name": "floor",
      "type": "Float",
      "isArray": false,
      "isPIIData": false,
      "isUniqueData": false,
      "description": "Floor number"
    },
    {
      "name": "status",
      "type": "String",
      "isArray": false,
      "isPIIData": false,
      "isUniqueData": false,
      "description": "occupied or vacant"
    }
  ]
}
```

- [ ] **Step 4: Write `Person.json`**

```json
{
  "schemaName": "Person",
  "collectionName": "blx_Persons",
  "schemaType": 1,
  "fields": [
    {
      "name": "email",
      "type": "String",
      "isArray": false,
      "isPIIData": true,
      "isUniqueData": true,
      "description": "Login email, joins to the IAM user"
    },
    {
      "name": "name",
      "type": "String",
      "isArray": false,
      "isPIIData": true,
      "isUniqueData": false,
      "description": "Display name"
    },
    {
      "name": "title",
      "type": "String",
      "isArray": false,
      "isPIIData": false,
      "isUniqueData": false,
      "description": "Display title, e.g. Flat 7-B or Caretaker"
    },
    {
      "name": "flatId",
      "type": "String",
      "isArray": false,
      "isPIIData": false,
      "isUniqueData": false,
      "description": "Flat label for residents"
    },
    {
      "name": "vendorId",
      "type": "String",
      "isArray": false,
      "isPIIData": false,
      "isUniqueData": false,
      "description": "Vendor id for vendor contacts"
    }
  ]
}
```

- [ ] **Step 5: Validate locally**

Run: `blocks data validate --json`
Expected: no errors reported for the three new files.

- [ ] **Step 6: Dry-run the push**

Run: `blocks data schema push --dry-run --json`
Expected: shows `Building`, `Flat`, `Person` as creates; the four existing schemas unchanged.

- [ ] **Step 7: STOP — get explicit user approval**

Show the dry-run output to the user and ask them to confirm pushing these three new schemas to the live tenant before continuing. Do not proceed to Step 8 without an explicit yes.

- [ ] **Step 8: Push for real**

Run: `blocks data schema push --yes --json`
Expected: `Building`, `Flat`, `Person` created on the tenant.

- [ ] **Step 9: Reload**

Run: `blocks data reload --dry-run --json` then, after confirming the output looks right, `blocks data reload --yes --json`.
Expected: reload succeeds; the three new collections are live for the Data Gateway.

- [ ] **Step 10: Confirm the actual list-response key**

The rest of this plan assumes Blocks pluralizes `Person` as `getPersons` (matching the existing regular `+s` pattern: `Vendor` → `getVendors`, `Request` → `getRequests`). This is the one thing that must be confirmed against the live response, not assumed — the SDK gotcha in `blocks-data-gateway-configuration` explicitly warns response shapes must be checked live. In a scratch script (or the Node REPL), call:

```ts
import { getBlocksClient } from "@/lib/blocks/client"
const client = getBlocksClient()
const res = await client!.data.collection("Person").list({ pageNo: 1, pageSize: 1 })
console.log(JSON.stringify(res, null, 2))
```

Expected: a top-level key under `data` that is either `getPersons` (assumed) or something else (e.g. `getPeople`). If it differs from `getPersons`, note the actual key now — Task 5 Step 2 uses it verbatim.

- [ ] **Step 11: Commit**

```bash
git add blocks/data/schemas/Building.json blocks/data/schemas/Flat.json blocks/data/schemas/Person.json
git commit -m "feat(data): add Building, Flat, and Person schemas"
```

---

### Task 5: `building-data.ts` — load, seed, save

**Files:**
- Modify: `src/lib/blocks/building-data.ts`

**Interfaces:**
- Consumes: `BuildingInfo`, `Flat`, `Person` (Task 1); `seedBuildingInfo`, `seedFlats`, `seedPeople` (Task 2); the confirmed list-response key from Task 4 Step 10
- Produces: `loadBuildingRecords()` return type grows `{ flats: Flat[]; people: Person[]; buildingInfo: BuildingInfo }`; `addFlat(input: { label: string; floor: number }): Promise<Flat>`; `saveBuildingInfo(input: Omit<BuildingInfo, "id">, existingId?: string): Promise<BuildingInfo>`; `savePerson(input: Omit<Person, "id">): Promise<Person>`

- [ ] **Step 1: Update the import line and add row types + mapping functions**

In `src/lib/blocks/building-data.ts`, change:

```ts
import { seedDecisions, seedNotices, seedRequests } from "@/data/seed"
import { vendors as directoryVendors } from "@/data/directory"
import { getBlocksClient } from "@/lib/blocks/client"
import type { Decision, Notice, RequestRecord, Vendor } from "@/types"
```

to:

```ts
import { seedBuildingInfo, seedDecisions, seedFlats, seedNotices, seedPeople, seedRequests } from "@/data/seed"
import { vendors as directoryVendors } from "@/data/directory"
import { getBlocksClient } from "@/lib/blocks/client"
import type { BuildingInfo, Decision, Flat, Notice, Person, RequestRecord, Vendor } from "@/types"
```

Add these types and mapping functions after the existing `requestToRow` function (before `listItems`):

```ts
type BuildingRow = Record<string, unknown> & {
  itemId?: string
  ItemId?: string
  name?: string
  addressLine?: string
  storeys?: number
  flatCount?: number
  fee?: number
}

const buildingFromRow = (row: BuildingRow): BuildingInfo => ({
  id: rowId(row),
  name: String(row.name ?? ""),
  addressLine: String(row.addressLine ?? ""),
  storeys: typeof row.storeys === "number" ? row.storeys : 0,
  flatCount: typeof row.flatCount === "number" ? row.flatCount : 0,
  fee: typeof row.fee === "number" ? row.fee : 0
})

const buildingToRow = (item: Omit<BuildingInfo, "id">) => ({
  name: item.name,
  addressLine: item.addressLine,
  storeys: item.storeys,
  flatCount: item.flatCount,
  fee: item.fee
})

type FlatRow = Record<string, unknown> & {
  itemId?: string
  ItemId?: string
  label?: string
  floor?: number
  status?: Flat["status"]
}

const flatFromRow = (row: FlatRow): Flat => ({
  id: String(row.label ?? rowId(row)),
  label: String(row.label ?? ""),
  floor: typeof row.floor === "number" ? row.floor : 0,
  status: (row.status ?? "occupied") as Flat["status"]
})

type PersonRow = Record<string, unknown> & {
  itemId?: string
  ItemId?: string
  email?: string
  name?: string
  title?: string
  flatId?: string
  vendorId?: string
}

const personFromRow = (row: PersonRow): Person => ({
  id: String(row.email ?? rowId(row)),
  email: String(row.email ?? ""),
  name: String(row.name ?? ""),
  title: String(row.title ?? ""),
  flatId: row.flatId ? String(row.flatId) : undefined,
  vendorId: row.vendorId ? String(row.vendorId) : undefined
})
```

- [ ] **Step 2: Extend `loadBuildingRecords`**

Change the no-client early return:

```ts
  if (!client) {
    return { requests: [] as RequestRecord[], decisions: [] as Decision[], notices: [] as Notice[], vendors: directoryVendors }
  }
```

to:

```ts
  if (!client) {
    return {
      requests: [] as RequestRecord[],
      decisions: [] as Decision[],
      notices: [] as Notice[],
      vendors: directoryVendors,
      flats: seedFlats,
      people: seedPeople,
      buildingInfo: seedBuildingInfo
    }
  }
```

After the `vendorsApi` declaration, add:

```ts
  const buildingApi = client.data.collection<BuildingRow>("Building", {
    fields: ["name", "addressLine", "storeys", "flatCount", "fee"]
  })
  const flatsApi = client.data.collection<FlatRow>("Flat", {
    fields: ["label", "floor", "status"]
  })
  const peopleApi = client.data.collection<PersonRow>("Person", {
    fields: ["email", "name", "title", "flatId", "vendorId"]
  })
```

Change the `Promise.all` to also fetch these three, and update the destructuring:

```ts
  const [requestRes, decisionRes, noticeRes, vendorRes, buildingRes, flatRes, personRes] = await Promise.all([
    requestsApi.list({ pageNo: 1, pageSize: 100 }),
    decisionsApi.list({ pageNo: 1, pageSize: 50 }),
    noticesApi.list({ pageNo: 1, pageSize: 50 }),
    vendorsApi.list({ pageNo: 1, pageSize: 20 }),
    buildingApi.list({ pageNo: 1, pageSize: 1 }),
    flatsApi.list({ pageNo: 1, pageSize: 100 }),
    peopleApi.list({ pageNo: 1, pageSize: 200 })
  ])
```

Before the final `return`, add (using the list-response key confirmed in Task 4 Step 10 — written here as `getPersons`; replace if the live check found a different key):

```ts
  const buildingRows = listItems<BuildingRow>(buildingRes, "getBuildings")
  const buildingInfo = buildingRows.length ? buildingFromRow(buildingRows[0]) : seedBuildingInfo

  const flatRows = listItems<FlatRow>(flatRes, "getFlats")
  const flats = flatRows.length ? flatRows.map(flatFromRow) : seedFlats

  const personRows = listItems<PersonRow>(personRes, "getPersons")
  const people = personRows.length ? personRows.map(personFromRow) : seedPeople
```

and change the final `return` to include `flats, people, buildingInfo` alongside the existing `requests`, `decisions`, `notices`, `vendors`.

- [ ] **Step 3: Extend `seedBuildingRecords`**

After the `noticesApi` declaration, add:

```ts
  const buildingApi = client.data.collection("Building")
  const flatsApi = client.data.collection("Flat")
  const peopleApi = client.data.collection("Person")
```

After the vendor-seeding `for` loop and before the request-seeding loop, add:

```ts
  await buildingApi.create(buildingToRow(seedBuildingInfo))

  for (const flat of seedFlats) {
    await flatsApi.create({ label: flat.label, floor: flat.floor, status: flat.status })
  }

  for (const person of seedPeople) {
    await peopleApi.create({
      email: person.email,
      name: person.name,
      title: person.title,
      flatId: person.flatId ?? "",
      vendorId: person.vendorId ?? ""
    })
  }
```

- [ ] **Step 4: Add `addFlat`, `saveBuildingInfo`, `savePerson`**

Append to the end of the file:

```ts
export const addFlat = async (input: { label: string; floor: number }): Promise<Flat> => {
  const flat: Flat = { id: input.label, label: input.label, floor: input.floor, status: "occupied" }
  const client = getBlocksClient()
  if (!client) return flat
  await client.data.collection("Flat").create({ label: input.label, floor: input.floor, status: "occupied" })
  return flat
}

export const saveBuildingInfo = async (
  input: Omit<BuildingInfo, "id">,
  existingId?: string
): Promise<BuildingInfo> => {
  const client = getBlocksClient()
  if (!client) return { ...input, id: existingId }
  const api = client.data.collection("Building")
  if (existingId) {
    await api.update(existingId, buildingToRow(input))
    return { ...input, id: existingId }
  }
  const created = (await api.create(buildingToRow(input))) as { itemId?: string; data?: { itemId?: string } }
  return { ...input, id: created.itemId ?? created.data?.itemId }
}

export const savePerson = async (input: Omit<Person, "id">): Promise<Person> => {
  const person: Person = { ...input, id: input.email }
  const client = getBlocksClient()
  if (!client) return person
  await client.data.collection("Person").create({
    email: input.email,
    name: input.name,
    title: input.title,
    flatId: input.flatId ?? "",
    vendorId: input.vendorId ?? ""
  })
  return person
}
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors in `src/lib/blocks/building-data.ts`. Errors remain in `src/lib/store.tsx` (Task 6) and the new registry components not yet created (Tasks 7-8).

- [ ] **Step 6: Commit**

```bash
git add src/lib/blocks/building-data.ts
git commit -m "feat(blocks-data): load, seed, and save Building/Flat/Person records"
```

---

### Task 6: `registry.ts` — IAM invite

**Files:**
- Create: `src/lib/blocks/registry.ts`

**Interfaces:**
- Consumes: `savePerson` (Task 5), `Person`, `Role` (Task 1)
- Produces: `invitePerson(input: InviteInput): Promise<Person>`, `listAccessStatus(emails: string[]): Promise<Record<string, "pending" | "active" | "unknown">>`

- [ ] **Step 1: Write the file**

```ts
import { savePerson } from "@/lib/blocks/building-data"
import { getBlocksClient } from "@/lib/blocks/client"
import type { Person, Role } from "@/types"

export type InviteInput = {
  name: string
  email: string
  role: Exclude<Role, "admin">
  flatId?: string
  vendorId?: string
}

export const invitePerson = async (input: InviteInput): Promise<Person> => {
  const client = getBlocksClient()
  if (client) {
    const [firstName, ...rest] = input.name.trim().split(" ")
    const created = (await client.iam.users.create({
      email: input.email,
      firstName: firstName || input.name,
      lastName: rest.join(" ") || firstName || input.name,
      roles: [input.role]
    })) as { userId?: string; itemId?: string; data?: { userId?: string; itemId?: string } }
    const userId = created.userId ?? created.itemId ?? created.data?.userId ?? created.data?.itemId
    if (userId) {
      await client.iam.users.updateAccess({ userId, roles: [input.role] })
    }
  }

  return savePerson({
    email: input.email,
    name: input.name,
    title: input.name,
    flatId: input.flatId,
    vendorId: input.vendorId
  })
}

export const listAccessStatus = async (
  emails: string[]
): Promise<Record<string, "pending" | "active" | "unknown">> => {
  const client = getBlocksClient()
  const status: Record<string, "pending" | "active" | "unknown"> = {}
  if (!client || emails.length === 0) return status

  await Promise.all(
    emails.map(async (email) => {
      try {
        const res = (await client.iam.users.list({ pageNo: 1, pageSize: 1, search: email })) as {
          items?: { email?: string; isActive?: boolean }[]
          data?: { items?: { email?: string; isActive?: boolean }[] }
        }
        const match = (res.data?.items ?? res.items ?? [])[0]
        status[email] = match ? (match.isActive ? "active" : "pending") : "unknown"
      } catch {
        status[email] = "unknown"
      }
    })
  )

  return status
}
```

- [ ] **Step 2: Note the response-shape caveat**

Per the `blocks-iam-users` skill's own gotcha, every IAM SDK request/response type is a loosely-typed `Record<string, unknown>` — the `userId`/`itemId`/`isActive` field names above are best guesses from the common shape, not guaranteed. Task 10's manual verification step (inviting one real test person) is what confirms these field names against the live tenant; if the invited person doesn't get the right role or the status column shows "unknown" for someone who should show "active", log the raw response from `client.iam.users.create`/`client.iam.users.list` and adjust the field names here to match.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors in `src/lib/blocks/registry.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/blocks/registry.ts
git commit -m "feat(blocks-iam): add invitePerson and listAccessStatus"
```

---

### Task 7: Wire `store.tsx`

**Files:**
- Modify: `src/lib/store.tsx`

**Interfaces:**
- Consumes: `demoRoleFromEmail`, `findPerson` (Task 3); `addFlat`, `saveBuildingInfo` (Task 5); `invitePerson` (Task 6); `BuildingInfo`, `Flat`, `Person` (Task 1)
- Produces: `BuildingApi` grows `buildingInfo: BuildingInfo | null`, `flats: Flat[]`, `people: Person[]`, `addFlat(input): Promise<void>`, `updateBuildingInfo(input): Promise<void>`, `invitePerson(input): Promise<void>`

- [ ] **Step 1: Update imports**

Change:

```ts
import {
  deskRoleFromSlugs,
  findPerson,
  personFromEmail,
  vendors as directoryVendors
} from "@/data/directory"
import { useAuth } from "@/lib/blocks/auth-context"
import {
  loadBuildingRecords,
  markNoticeReadRemote,
  saveNotice,
  saveRequest,
  seedBuildingRecords
} from "@/lib/blocks/building-data"
import type {
  Decision,
  Notice,
  RequestRecord,
  Session,
  Urgency,
  Vendor
} from "@/types"
```

to:

```ts
import {
  deskRoleFromSlugs,
  demoRoleFromEmail,
  findPerson,
  vendors as directoryVendors
} from "@/data/directory"
import { useAuth } from "@/lib/blocks/auth-context"
import {
  addFlat as addFlatRecord,
  loadBuildingRecords,
  markNoticeReadRemote,
  saveBuildingInfo,
  saveNotice,
  saveRequest,
  seedBuildingRecords
} from "@/lib/blocks/building-data"
import { invitePerson as invitePersonRecord, type InviteInput } from "@/lib/blocks/registry"
import type {
  BuildingInfo,
  Decision,
  Flat,
  Notice,
  Person,
  RequestRecord,
  Session,
  Urgency,
  Vendor
} from "@/types"
```

- [ ] **Step 2: Extend `BuildingState` and its initial value**

Change:

```ts
type BuildingState = {
  session: Session | null
  requests: RequestRecord[]
  decisions: Decision[]
  notices: Notice[]
  vendors: Vendor[]
}
```

to:

```ts
type BuildingState = {
  session: Session | null
  requests: RequestRecord[]
  decisions: Decision[]
  notices: Notice[]
  vendors: Vendor[]
  flats: Flat[]
  people: Person[]
  buildingInfo: BuildingInfo | null
}
```

Change the `useState<BuildingState>` initializer to add `flats: [], people: [], buildingInfo: null` alongside the existing fields.

- [ ] **Step 3: Update the auth-resolution `useEffect`**

Change:

```ts
    const person = personFromEmail(claims.email)
    const role = deskRoleFromSlugs(roles) ?? person?.role
```

to:

```ts
    const role = deskRoleFromSlugs(roles) ?? demoRoleFromEmail(claims.email)
```

(`personFromEmail` is no longer called here — profile lookup now goes through the loaded `people` list via `findPerson` inside the `api` memo, not at session-resolution time.)

- [ ] **Step 4: Update `findPerson` call site and `BuildingApi` type**

In the `api = useMemo<BuildingApi>(...)` block, change:

```ts
    const actor = state.session ? findPerson(state.session.actorId) : null
```

to:

```ts
    const actor = state.session ? findPerson(state.session.actorId, state.people) : null
```

Add three fields to the `BuildingApi` type (after `markNoticeRead`):

```ts
  addFlat: (input: { label: string; floor: number }) => Promise<void>
  updateBuildingInfo: (input: Omit<BuildingInfo, "id">) => Promise<void>
  invitePerson: (input: InviteInput) => Promise<void>
```

- [ ] **Step 5: Implement the three new actions**

In the object returned from the `api` memo, after `markNoticeRead`, add:

```ts
      addFlat: async (input) => {
        const flat = await addFlatRecord(input)
        setState((current) => ({ ...current, flats: [...current.flats, flat] }))
      },
      updateBuildingInfo: async (input) => {
        const saved = await saveBuildingInfo(input, state.buildingInfo?.id)
        setState((current) => ({ ...current, buildingInfo: saved }))
      },
      invitePerson: async (input) => {
        const person = await invitePersonRecord(input)
        setState((current) => ({ ...current, people: [...current.people, person] }))
      },
```

- [ ] **Step 6: Update `useSessionActor`**

`src/lib/store.tsx`'s `useSessionActor` currently calls `findPerson(session.actorId)` with one argument — change to:

```ts
export const useSessionActor = () => {
  const { session, people } = useBuilding()
  if (!session) return null
  const person = findPerson(session.actorId, people)
  return { ...person, role: session.role }
}
```

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors anywhere in `src/lib/store.tsx`. Any remaining errors should only be in files not yet touched (the registry UI, Task 8).

- [ ] **Step 8: Commit**

```bash
git add src/lib/store.tsx
git commit -m "feat(store): load Building/Flat/Person state, add registration actions"
```

---

### Task 8: Registry screen — Building & Flats panels

**Files:**
- Create: `src/app/committee/registry/page.tsx`
- Create: `src/components/registry/building-panel.tsx`
- Create: `src/components/registry/flats-panel.tsx`

**Interfaces:**
- Consumes: `useBuilding()` (`buildingInfo`, `flats`, `updateBuildingInfo`, `addFlat` from Task 7), `Button` (existing), `fadeRise` motion variant (existing, `src/lib/motion.ts`)

- [ ] **Step 1: `building-panel.tsx`**

```tsx
"use client"

import { motion } from "framer-motion"
import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { fadeRise } from "@/lib/motion"
import type { BuildingInfo } from "@/types"

export const BuildingPanel = ({
  buildingInfo,
  onSave
}: {
  buildingInfo: BuildingInfo | null
  onSave: (input: Omit<BuildingInfo, "id">) => Promise<void>
}) => {
  const [name, setName] = useState(buildingInfo?.name ?? "")
  const [addressLine, setAddressLine] = useState(buildingInfo?.addressLine ?? "")
  const [storeys, setStoreys] = useState(String(buildingInfo?.storeys ?? ""))
  const [flatCount, setFlatCount] = useState(String(buildingInfo?.flatCount ?? ""))
  const [fee, setFee] = useState(String(buildingInfo?.fee ?? ""))
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      await onSave({
        name,
        addressLine,
        storeys: Number(storeys) || 0,
        flatCount: Number(flatCount) || 0,
        fee: Number(fee) || 0
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.form
      onSubmit={(event) => void handleSubmit(event)}
      initial="hidden"
      animate="visible"
      variants={fadeRise}
      className="space-y-4 border border-hairline bg-surface p-4 md:p-6"
    >
      <h2 className="font-display text-xl">Building</h2>
      <label className="block" htmlFor="building-name">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Name</span>
        <input
          id="building-name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 min-h-11 w-full border border-hairline bg-surface-2 px-3 text-[16px]"
        />
      </label>
      <label className="block" htmlFor="building-address">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Address</span>
        <input
          id="building-address"
          required
          value={addressLine}
          onChange={(event) => setAddressLine(event.target.value)}
          className="mt-2 min-h-11 w-full border border-hairline bg-surface-2 px-3 text-[16px]"
        />
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="block" htmlFor="building-storeys">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Storeys</span>
          <input
            id="building-storeys"
            type="number"
            min={0}
            value={storeys}
            onChange={(event) => setStoreys(event.target.value)}
            className="mt-2 min-h-11 w-full border border-hairline bg-surface-2 px-3 text-[16px]"
          />
        </label>
        <label className="block" htmlFor="building-flat-count">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Flat count</span>
          <input
            id="building-flat-count"
            type="number"
            min={0}
            value={flatCount}
            onChange={(event) => setFlatCount(event.target.value)}
            className="mt-2 min-h-11 w-full border border-hairline bg-surface-2 px-3 text-[16px]"
          />
        </label>
        <label className="block" htmlFor="building-fee">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Fee (৳)</span>
          <input
            id="building-fee"
            type="number"
            min={0}
            value={fee}
            onChange={(event) => setFee(event.target.value)}
            className="mt-2 min-h-11 w-full border border-hairline bg-surface-2 px-3 text-[16px]"
          />
        </label>
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save building"}
      </Button>
    </motion.form>
  )
}
```

- [ ] **Step 2: `flats-panel.tsx`**

```tsx
"use client"

import { motion } from "framer-motion"
import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { fadeRise, staggerContainer } from "@/lib/motion"
import type { Flat } from "@/types"

export const FlatsPanel = ({
  flats,
  onAdd
}: {
  flats: Flat[]
  onAdd: (input: { label: string; floor: number }) => Promise<void>
}) => {
  const [label, setLabel] = useState("")
  const [floor, setFloor] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!label.trim()) return
    setSaving(true)
    try {
      await onAdd({ label: label.trim(), floor: Number(floor) || 0 })
      setLabel("")
      setFloor("")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="border border-hairline bg-surface p-4 md:p-6">
      <h2 className="font-display text-xl">Flats</h2>
      <motion.ul variants={staggerContainer} initial="hidden" animate="visible" className="mt-4 space-y-2">
        {flats.map((flat) => (
          <motion.li
            key={flat.id}
            variants={fadeRise}
            className="flex items-center justify-between border border-hairline bg-surface-2 px-3 py-2 text-sm"
          >
            <span>{flat.label}</span>
            <span className="text-ink-faint">Floor {flat.floor}</span>
          </motion.li>
        ))}
      </motion.ul>
      <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block" htmlFor="flat-label">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Label</span>
          <input
            id="flat-label"
            required
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="12-C"
            className="mt-2 min-h-11 w-32 border border-hairline bg-surface-2 px-3 text-[16px]"
          />
        </label>
        <label className="block" htmlFor="flat-floor">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Floor</span>
          <input
            id="flat-floor"
            type="number"
            min={0}
            value={floor}
            onChange={(event) => setFloor(event.target.value)}
            className="mt-2 min-h-11 w-24 border border-hairline bg-surface-2 px-3 text-[16px]"
          />
        </label>
        <Button type="submit" disabled={saving}>
          {saving ? "Adding…" : "Add flat"}
        </Button>
      </form>
    </section>
  )
}
```

- [ ] **Step 3: `registry/page.tsx`, Building + Flats only for now**

```tsx
"use client"

import { AppShell } from "@/components/layout/app-shell"
import { BuildingPanel } from "@/components/registry/building-panel"
import { FlatsPanel } from "@/components/registry/flats-panel"
import { useBuilding } from "@/lib/store"

const RegistryPage = () => {
  const { buildingInfo, flats, updateBuildingInfo, addFlat } = useBuilding()

  return (
    <AppShell allow={["committee"]}>
      <h1 className="font-display text-[32px] leading-tight">Registry</h1>
      <p className="mt-2 text-ink-soft">Register flats, invite people, and keep building details current.</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <BuildingPanel buildingInfo={buildingInfo} onSave={updateBuildingInfo} />
        <FlatsPanel flats={flats} onAdd={addFlat} />
      </div>
    </AppShell>
  )
}

export default RegistryPage
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors in the three new files.

- [ ] **Step 5: Commit**

```bash
git add src/app/committee/registry/page.tsx src/components/registry/building-panel.tsx src/components/registry/flats-panel.tsx
git commit -m "feat(registry): add Building and Flats panels"
```

---

### Task 9: Registry screen — People & Vendors panels

**Files:**
- Create: `src/components/registry/people-panel.tsx`
- Create: `src/components/registry/vendors-panel.tsx`
- Modify: `src/app/committee/registry/page.tsx`
- Modify: `src/lib/store.tsx` (expose `addVendor`)
- Modify: `src/lib/blocks/building-data.ts` (add `addVendor`)

**Interfaces:**
- Consumes: `invitePerson`, `listAccessStatus` (Task 6); `people`, `flats`, `vendors` from `useBuilding()` (Task 7)
- Produces: `addVendor(input: { name: string; trade: string }): Promise<void>` on `BuildingApi`

- [ ] **Step 1: Add `addVendor` to `building-data.ts`**

Append to `src/lib/blocks/building-data.ts`:

```ts
export const addVendor = async (input: { name: string; trade: string }): Promise<Vendor> => {
  const vendor: Vendor = { id: input.name.toLowerCase().replace(/\s+/g, "-"), name: input.name, trade: input.trade }
  const client = getBlocksClient()
  if (!client) return vendor
  await client.data.collection("Vendor").create({ name: input.name, trade: input.trade })
  return vendor
}
```

- [ ] **Step 2: Wire `addVendor` through `store.tsx`**

Add the import (alongside the existing `building-data` import block): `addVendor as addVendorRecord,`.

Add to `BuildingApi`: `addVendor: (input: { name: string; trade: string }) => Promise<void>`.

Add to the returned object:

```ts
      addVendor: async (input) => {
        const vendor = await addVendorRecord(input)
        setState((current) => ({ ...current, vendors: [...current.vendors, vendor] }))
      },
```

- [ ] **Step 3: `vendors-panel.tsx`**

```tsx
"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import type { Vendor } from "@/types"

export const VendorsPanel = ({
  vendors,
  onAdd
}: {
  vendors: Vendor[]
  onAdd: (input: { name: string; trade: string }) => Promise<void>
}) => {
  const [name, setName] = useState("")
  const [trade, setTrade] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim() || !trade.trim()) return
    setSaving(true)
    try {
      await onAdd({ name: name.trim(), trade: trade.trim() })
      setName("")
      setTrade("")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="border border-hairline bg-surface p-4 md:p-6">
      <h2 className="font-display text-xl">Vendors</h2>
      <ul className="mt-4 space-y-2">
        {vendors.map((vendor) => (
          <li key={vendor.id} className="flex items-center justify-between border border-hairline bg-surface-2 px-3 py-2 text-sm">
            <span>{vendor.name}</span>
            <span className="text-ink-faint">{vendor.trade}</span>
          </li>
        ))}
      </ul>
      <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block" htmlFor="vendor-name">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Name</span>
          <input
            id="vendor-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 min-h-11 w-48 border border-hairline bg-surface-2 px-3 text-[16px]"
          />
        </label>
        <label className="block" htmlFor="vendor-trade">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Trade</span>
          <input
            id="vendor-trade"
            required
            value={trade}
            onChange={(event) => setTrade(event.target.value)}
            placeholder="Electrical"
            className="mt-2 min-h-11 w-40 border border-hairline bg-surface-2 px-3 text-[16px]"
          />
        </label>
        <Button type="submit" disabled={saving}>
          {saving ? "Adding…" : "Add vendor"}
        </Button>
      </form>
    </section>
  )
}
```

- [ ] **Step 4: `people-panel.tsx`**

```tsx
"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { listAccessStatus } from "@/lib/blocks/registry"
import type { Flat, Person, Role, Vendor } from "@/types"

const INVITABLE_ROLES: Exclude<Role, "admin">[] = ["resident", "staff", "committee", "vendor"]

export const PeoplePanel = ({
  people,
  flats,
  vendors,
  onInvite
}: {
  people: Person[]
  flats: Flat[]
  vendors: Vendor[]
  onInvite: (input: {
    name: string
    email: string
    role: Exclude<Role, "admin">
    flatId?: string
    vendorId?: string
  }) => Promise<void>
}) => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Exclude<Role, "admin">>("resident")
  const [flatId, setFlatId] = useState("")
  const [vendorId, setVendorId] = useState("")
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<Record<string, "pending" | "active" | "unknown">>({})

  useEffect(() => {
    let cancelled = false
    void listAccessStatus(people.map((person) => person.email)).then((result) => {
      if (!cancelled) setStatus(result)
    })
    return () => {
      cancelled = true
    }
  }, [people])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim() || !email.trim()) return
    setSaving(true)
    try {
      await onInvite({
        name: name.trim(),
        email: email.trim(),
        role,
        flatId: role === "resident" ? flatId || undefined : undefined,
        vendorId: role === "vendor" ? vendorId || undefined : undefined
      })
      setName("")
      setEmail("")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="border border-hairline bg-surface p-4 md:p-6">
      <h2 className="font-display text-xl">People</h2>
      <ul className="mt-4 space-y-2">
        {people.map((person) => (
          <li key={person.id} className="flex items-center justify-between border border-hairline bg-surface-2 px-3 py-2 text-sm">
            <span>
              {person.name} <span className="text-ink-faint">— {person.title}</span>
            </span>
            <span className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">
              {status[person.email] ?? "…"}
            </span>
          </li>
        ))}
      </ul>
      <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <label className="block" htmlFor="person-name">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Name</span>
            <input
              id="person-name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 min-h-11 w-48 border border-hairline bg-surface-2 px-3 text-[16px]"
            />
          </label>
          <label className="block" htmlFor="person-email">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Email</span>
            <input
              id="person-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 min-h-11 w-56 border border-hairline bg-surface-2 px-3 text-[16px]"
            />
          </label>
          <label className="block" htmlFor="person-role">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Role</span>
            <select
              id="person-role"
              value={role}
              onChange={(event) => setRole(event.target.value as Exclude<Role, "admin">)}
              className="mt-2 block min-h-11 border border-hairline bg-surface px-3 text-[16px]"
            >
              {INVITABLE_ROLES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          {role === "resident" ? (
            <label className="block" htmlFor="person-flat">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Flat</span>
              <select
                id="person-flat"
                value={flatId}
                onChange={(event) => setFlatId(event.target.value)}
                className="mt-2 block min-h-11 border border-hairline bg-surface px-3 text-[16px]"
              >
                <option value="">Select a flat</option>
                {flats.map((flat) => (
                  <option key={flat.id} value={flat.id}>
                    {flat.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {role === "vendor" ? (
            <label className="block" htmlFor="person-vendor">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Vendor</span>
              <select
                id="person-vendor"
                value={vendorId}
                onChange={(event) => setVendorId(event.target.value)}
                className="mt-2 block min-h-11 border border-hairline bg-surface px-3 text-[16px]"
              >
                <option value="">Select a vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "Inviting…" : "Invite person"}
        </Button>
      </form>
    </section>
  )
}
```

- [ ] **Step 5: Wire both panels into `registry/page.tsx`**

Replace the file with:

```tsx
"use client"

import { AppShell } from "@/components/layout/app-shell"
import { BuildingPanel } from "@/components/registry/building-panel"
import { FlatsPanel } from "@/components/registry/flats-panel"
import { PeoplePanel } from "@/components/registry/people-panel"
import { VendorsPanel } from "@/components/registry/vendors-panel"
import { useBuilding } from "@/lib/store"

const RegistryPage = () => {
  const { buildingInfo, flats, people, vendors, updateBuildingInfo, addFlat, invitePerson, addVendor } =
    useBuilding()

  return (
    <AppShell allow={["committee"]}>
      <h1 className="font-display text-[32px] leading-tight">Registry</h1>
      <p className="mt-2 text-ink-soft">Register flats, invite people, and keep building details current.</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <BuildingPanel buildingInfo={buildingInfo} onSave={updateBuildingInfo} />
        <FlatsPanel flats={flats} onAdd={addFlat} />
        <PeoplePanel people={people} flats={flats} vendors={vendors} onInvite={invitePerson} />
        <VendorsPanel vendors={vendors} onAdd={addVendor} />
      </div>
    </AppShell>
  )
}

export default RegistryPage
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: clean, no errors anywhere in the project.

- [ ] **Step 7: Lint**

Run: `npm run lint`
Expected: only the two pre-existing errors in `src/lib/blocks/auth-context.tsx` and `src/lib/store.tsx` (`react-hooks/set-state-in-effect`, present before this plan — see Task 11 for confirmation these are unrelated). No new errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/registry/people-panel.tsx src/components/registry/vendors-panel.tsx src/app/committee/registry/page.tsx src/lib/store.tsx src/lib/blocks/building-data.ts
git commit -m "feat(registry): add People and Vendors panels, wire addVendor"
```

---

### Task 10: Dynamic building name in the app shell + nav link

**Files:**
- Modify: `src/components/layout/site-header.tsx`

**Interfaces:**
- Consumes: `buildingInfo` from `useBuilding()` (Task 7)

- [ ] **Step 1: Replace the hardcoded subtitle**

In `src/components/layout/site-header.tsx`, the header currently destructures `{ signOut, notices, session }` from `useBuilding()` and renders a hardcoded `<p className="text-sm text-ink-faint">Uttara Heights</p>`. Change the destructure to add `buildingInfo`:

```ts
  const { signOut, notices, session, buildingInfo } = useBuilding()
```

and change:

```tsx
          <p className="text-sm text-ink-faint">Uttara Heights</p>
```

to:

```tsx
          <p className="text-sm text-ink-faint">{buildingInfo?.name ?? "Uttara Heights"}</p>
```

- [ ] **Step 2: Add the Registry nav item for committee/admin**

In the `navFor` function's `case "admin": case "committee":` branch, add a `Registry` entry:

```ts
    case "admin":
    case "committee":
      return [
        { href: "/committee", label: "Desk" },
        { href: "/committee/registry", label: "Registry" },
        { href: "/staff", label: "Board" },
        { href: "/inbox", label: "Alerts" },
        { href: "/account", label: "Account" }
      ]
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean (same two pre-existing lint errors as before, nothing new).

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/site-header.tsx
git commit -m "feat(nav): show live building name, add Registry link"
```

---

### Task 11: Verification

**Files:** none (verification only)

- [ ] **Step 1: Full type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 2: Full lint**

Run: `npm run lint`
Expected: only the two pre-existing `react-hooks/set-state-in-effect` errors in `src/lib/blocks/auth-context.tsx` and `src/lib/store.tsx` — confirm by running `git stash && npm run lint; git stash pop` and checking the same two errors appear on the pre-plan tree.

- [ ] **Step 3: Seed check**

Run: `npx tsx src/data/seed-check.ts`
Expected: prints the ok line with no thrown error.

- [ ] **Step 4: Dev server smoke test**

Start the dev server (`npm run dev` — needs the HTTPS proxy per `blocks-frontend-local-https`, or `npx next dev --hostname 127.0.0.1 --port 3000` over plain HTTP for a shell-only check), confirm the home page renders using `FALLBACK_BUILDING.name` ("BashaCare") pre-login, and that there are no console/server errors. This mirrors the verification already done earlier in this project's history for the motion-polish work.

- [ ] **Step 5: STOP — real invite test needs explicit go-ahead**

The remaining checks below create a real Blocks IAM user and real Data rows on the live tenant. Do not run them without the user explicitly confirming each one in the moment, per the `blocks-iam-users` skill's confirm-before-mutating rule:

- Log in as the admin account, open `/committee/registry`.
- Add a flat (e.g. `12-C`), confirm it appears in the Flats list and in the Person invite form's flat picker.
- Edit and save the Building panel, confirm the header subtitle and home-page-after-login building name update.
- Invite one disposable test person (e.g. a `yopmail.com` address) as a resident on a test flat, confirm they appear in the People list, and confirm the access-status column reflects reality against what `client.iam.users.list` actually returns (adjust `registry.ts`'s field names per Task 6 Step 2 if the status is wrong).
- Add a vendor, confirm it appears in Vendors and in the Person invite form's vendor picker.
- Run the existing scripted demo (BRD FR-7: flat 7-B lift fault → triage → assign → resident verifies → closed) end-to-end to confirm nothing broke.

- [ ] **Step 6: No commit** — this task is verification-only; nothing to commit unless Step 5 surfaces a fix, in which case fix it in the relevant task's file and commit with a message describing the correction (e.g. `fix(registry): correct IAM list response field name`).

---

## Self-Review

**Spec coverage:**
- §3.1 new schemas → Task 4.
- §3.2 registration/invite screen (Building/Flats/People/Vendors panels, role list excludes admin) → Tasks 8-9.
- §3.3 identity resolution (Person-list lookup, IAM stays role source) → Tasks 3, 7.
- §3.4 seed migration (Building, 7-B/10-A flats, 7-person cast, no real IAM accounts required for seed) → Task 2, Task 5 Step 3.
- §3.5 non-goals (no signup surface, no schema changes to Request/Vendor/Decision/Notice, no new Data access policy) → respected throughout; `blocks/data/rules.json` is never touched by any task.
- §4 testing (registration end-to-end, Building edit renders, scripted demo still works, tsc/lint clean) → Task 11.

**Placeholder scan:** no TBD/TODO; the one explicitly-flagged unknown (the `getPersons` list-response key and IAM response field names) is not a placeholder — it's a documented external-system uncertainty with a concrete verification procedure (Task 4 Step 10, Task 6 Step 2, Task 11 Step 5), which is the honest way to handle a live-API shape this plan cannot query itself.

**Type consistency:** `BuildingInfo`/`Flat`/`Person` (Task 1) are used with identical field names across `seed.ts` (Task 2), `directory.ts` (Task 3), `building-data.ts` (Task 5), `registry.ts` (Task 6), `store.tsx` (Task 7), and all four panel components (Tasks 8-9) — checked field-by-field while writing this plan (`label`/`floor`/`status` for `Flat`; `email`/`name`/`title`/`flatId`/`vendorId` for `Person`; `name`/`addressLine`/`storeys`/`flatCount`/`fee` for `BuildingInfo`).
