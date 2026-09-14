# Building & Flat Registration — Design

**Status:** Approved for planning
**Date:** 2026-09-14
**Relates to:** `BRD.md` §8 feasibility ("Four roles + row isolation — Partial... Add resident/staff/committee/vendor roles before row policies"), §9 assumption 1-2 (single hardcoded building/cast)

## 1. Problem

`src/data/directory.ts` hardcodes the building (`BUILDING` constant) and every person in it (`people[]`, 7 entries). Adding a flat, a resident, a staff member, or a vendor requires editing code and redeploying. There is no admin-facing way to register a house or onboard a person. Role is resolved by matching a Blocks IAM login email against this static array, falling back to it whenever IAM role claims are absent.

This spec covers turning the building's roster into real data that admin/committee can manage from the app, without changing the single-building scope the BRD locked for v1.

## 2. Decisions (from brainstorming)

- Registration is **admin/committee only** — no public/self-service signup.
- Onboarding a person means a **real Blocks IAM invite** (`blocks-iam-users` create + `updateAccess`), not just adding a row the person has to already have login access for.
- The existing 7-person demo cast is **migrated into the new schema as seed data** — the scripted demo (BRD FR-7) keeps working unchanged.
- **Building info** (name, address, storeys, flat count, fee) becomes an editable record in this same slice, not left hardcoded.

## 3. Architecture

**Role truth stays in Blocks IAM.** The new `Person` data is profile/linking information only — which flat or vendor someone belongs to, their display name and title. Authorization (`deskRoleFromSlugs`) continues to come from IAM role claims exactly as it does today. This was chosen over storing role on `Person` directly (rejected: duplicates authorization outside IAM and works against the BRD's stated plan to enforce row-level Data policies by IAM role later) and over a synced hybrid (rejected: extra moving parts, no benefit at this scale).

### 3.1 New Blocks Data schemas

| Schema | Fields | Notes |
|---|---|---|
| `Building` | `name`, `addressLine`, `storeys`, `flatCount`, `fee` | Single row. Replaces the `BUILDING` constant. |
| `Flat` | `label` (e.g. `"7-B"`), `floor`, `status` (`occupied`/`vacant`) | One row per registered unit. |
| `Person` | `email`, `name`, `title`, `flatId?`, `vendorId?` | `email` is the join key to the IAM user. No `role` field. |

`Vendor` schema already exists (`blocks/data/schemas/Vendor.json`) — unchanged, but gains a creation UI (see 3.2).

### 3.2 Registration/invite screen

New route, e.g. `/committee/registry`, gated the same way the committee desk is today (`AppShell allow={["committee"]}`; admin always passes per existing `AppShell` logic). Four panels:

- **Building** — edit the one `Building` row.
- **Flats** — list + "Add flat" (label, floor).
- **People** — list + "Invite person" (name, email, role select limited to `resident` / `staff` / `committee` / `vendor` — `admin` is not grantable from this screen, matching the BRD's System User invite path — flat picker for residents / vendor picker for vendors). Submit does, in order: IAM user create → `updateAccess` granting the chosen role → create the `Person` row. List shows activation status (pending/active) read from IAM.
- **Vendors** — list + "Add vendor" (name, trade) against the existing `Vendor` schema — no creation UI exists for it today.

### 3.3 Identity resolution changes

`loadBuildingRecords()` in `src/lib/blocks/building-data.ts` grows three more fetches (`Building`, `Flat`, `Person`), following the exact pattern already used for `requests`/`vendors`/`notices`. `directory.ts`'s `personFromEmail` changes from a static-array `.find` to a lookup against the loaded `Person` list. `deskRoleFromSlugs` and all IAM role handling in `store.tsx` / `role-home.ts` are unchanged.

If an authenticated user has an IAM role but no `Person` row yet (invited but registration incomplete, or any other gap), reuse the existing "No desk for this account" state in `src/app/page.tsx` rather than adding a new one.

### 3.4 Seed migration

`seedBuildingRecords()` (in `building-data.ts`) gains:
- One `Building` row seeded from today's hardcoded constant values.
- `Flat` rows for the two flats the scripted demo actually references: `7-B`, `10-A`. The other 46 units aren't referenced anywhere — registering them is what the new UI is for, not something to fake in seed data.
- `Person` rows for the existing 7-person cast (Noor/admin, Nusrat, Karim, Hasan, Rina, and the two vendor contacts).

No new real Blocks IAM accounts are required for the 6 non-admin demo personas — as today, their `Person` rows just drive display data; the IAM invite path is exercised by new registrations going forward, not by seed data.

### 3.5 Non-goals

- No self-service/public signup.
- No multi-building or tenant switching.
- No changes to `Request` / `Vendor` (schema) / `Notice` / `Decision` schemas.
- No server-side row-level Data access policy in this slice — still app-level filtering as today. (Explicitly the BRD's *next* deferred step, not this one.)

## 4. Testing

- Admin adds a flat, invites a resident with a role, confirms the person can log in and see only their flat's requests.
- Admin edits Building info and confirms it renders on the public home page.
- Run the existing scripted demo (BRD FR-7) end-to-end to confirm it still works after the data-source switch.
- `tsc --noEmit` and `npm run lint` clean.
