# BashaCare

Apartment maintenance desk for **Uttara Heights** — a 48-flat building in Uttara, Dhaka. Residents report problems, staff triage and assign vendors, the committee tracks spend, and nothing closes until the resident verifies the work.

Built with **Next.js App Router** on **SELISE Blocks** (hosted login, Data, file storage).

| Doc | Purpose |
| --- | --- |
| [`BRD.md`](./BRD.md) | Product requirements and locked decisions |
| [`DESIGN.md`](./DESIGN.md) | Visual system (colors, type, urgency language) |
| [`.design/basha-care/INFORMATION_ARCHITECTURE.md`](./.design/basha-care/INFORMATION_ARCHITECTURE.md) | Routes, nav, and user flows |

## Prerequisites

- Node.js 20+
- [Blocks CLI](https://github.com/SELISEdigitalplatforms/blocks-cli): `npm install -g @seliseblocks/cli-os@latest`
- Project access to tenant `D975c4874bd6b47b995cce54f926c09cc` (BashaCare, dev)

## Quick start

```bash
npm install
npm run check:seed
npm run cert          # first time on a machine
npm run dev
```

Open **`https://dbsblo.slsblx.com`** — not `localhost`.

`npm run dev` runs Next.js on `127.0.0.1:3000` and an HTTPS proxy on port 443.

**First time on a machine:**

1. Add `127.0.0.1 dbsblo.slsblx.com` to `/etc/hosts`
2. Run `npm run cert` (first run may ask for sudo to bind port 443)
3. Copy env vars into `.env.local` from `blocks projects get` and `blocks auth oidc-clients list`
4. Run `blocks init` in the repo root

OIDC callback: `https://dbsblo.slsblx.com/login/callback`

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | HTTPS dev server (Next + proxy) |
| `npm run dev:next` | Next.js only on port 3000 (no HTTPS proxy) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run check:seed` | Verify demo seed data |
| `npm run check:roster` | Verify building roster helpers |

## Roles — full picture

Each signed-in user needs a **Blocks IAM role** and a matching **`Person` row**. IAM role alone shows “No desk for this account”.

### Capability matrix

| Capability | Resident | Staff | Committee | Admin | Vendor |
| --- | :---: | :---: | :---: | :---: | :---: |
| **Home** | `/resident` | `/staff` | `/committee` | `/committee` | `/vendor` |
| Report a problem (message + photo) | ✓ | — | — | — | — |
| View own requests + verify closure | ✓ | — | — | — | — |
| Triage board (acknowledge, assign, AI override) | — | ✓ | — | ✓ | — |
| Attach evidence + record job cost | — | ✓ | — | ✓ | upload on assigned job |
| Committee desk (spend, slow vendors, urgencies) | — | — | ✓ | ✓ | — |
| Record / view replace decisions | — | — | ✓ | ✓ | — |
| Registration (building, flats, invites, vendors) | — | — | ✓ | ✓ | — |
| Grant `admin` IAM role | — | — | — | portal only | — |
| Seed empty tenant data on first login | — | — | — | ✓ | — |
| See all alerts in inbox | — | role-scoped | role-scoped | ✓ all | role-scoped |
| Edit own profile + photo | ✓ | ✓ | ✓ | ✓ | ✓ |
| See maintenance fee (৳) on roster | — | — | ✓ | ✓ | — |
| See money on request cards | — | ✓ | ✓ | ✓ | — |

**Nav by role**

| Role | Primary nav |
| --- | --- |
| Resident | Requests · New · Alerts · Account |
| Staff | Board · Alerts · Account |
| Committee | Desk · Registration · Alerts · Account |
| Admin | Desk · Registration · **Board** · Alerts · Account |
| Vendor | Jobs · Alerts · Account |

**Data isolation**

- **Resident** — own flat’s requests only; assigned flat on home; no finances.
- **Staff** — all requests; all flats on board (no fee); no Registration.
- **Committee** — all requests on desk rollups; all flats + fee on desk; Registration write; **cannot** open staff Board (redirects home).
- **Admin** — operator superset: committee + staff surfaces; seeds Building/Flat/Person when empty.
- **Vendor** — jobs assigned to their vendor only; flats from those jobs; no finances.

Spec: [`docs/superpowers/specs/2026-09-14-admin-committee-split-design.md`](./docs/superpowers/specs/2026-09-14-admin-committee-split-design.md)

### Demo accounts

Hosted login: `https://dbsblo.slsblx.com`

| Email | Role | Demo persona |
| --- | --- | --- |
| `noor@yopmail.com` | **admin** | Noor Mohammad · operator |
| `nusrat@yopmail.com` | resident | Nusrat Rahman · Flat 7-B |
| `karim@yopmail.com` | resident | Karim Hossain · Flat 10-A |
| `hasan@yopmail.com` | staff | Hasan Mia · Caretaker |
| `rina@yopmail.com` | committee | Rina Chowdhury · Treasurer |
| `rafiq@yopmail.com` | vendor | Rafiq Uddin · Metro Lift AMC |
| `rahman@yopmail.com` | vendor | Abdur Rahman · Rahman Pump Service |
| `amin@yopmail.com` | vendor | Amin Hossain · Uttara Electric |

Each account needs **IAM role** (Blocks portal) **and** a matching **`Person` row** (Registration invite or admin seed on first login). Registration cannot invite `admin` — grant **`admin`** to `noor@yopmail.com` in the Blocks portal.

**Password (every account in this table):** `Pass@123`

### Fresh start — Registration (admin: `noor@yopmail.com`)

Sign in → **Registration** (`/committee/registry`). Work top to bottom.

**1. Building**

| Field | Value |
| --- | --- |
| Name | Uttara Heights |
| Address | House 18, Road 7, Uttara |
| Storeys | 12 |
| Flat count | 48 |
| Maintenance fee (৳) | 2500 |

**2. Flats** (add both)

| Label | Floor | Status |
| --- | --- | --- |
| 7-B | 7 | Occupied |
| 10-A | 10 | Occupied |

**3. Vendors** (add all three — or confirm they already exist)

| Name | Trade |
| --- | --- |
| Metro Lift AMC | Lift |
| Rahman Pump Service | Water / pump |
| Uttara Electric | Electrical |

**4. People** (invite via Registration — **Confirm AI** happens later on the staff Board, not here)

| Name | Email | IAM role (portal) | Registration fields |
| --- | --- | --- | --- |
| Noor Mohammad | `noor@yopmail.com` | **admin** (portal only) | — |
| Nusrat Rahman | `nusrat@yopmail.com` | resident | Flat **7-B** |
| Karim Hossain | `karim@yopmail.com` | resident | Flat **10-A** |
| Hasan Mia | `hasan@yopmail.com` | staff | — |
| Rina Chowdhury | `rina@yopmail.com` | committee | — |
| Rafiq Uddin | `rafiq@yopmail.com` | vendor | Vendor **Metro Lift AMC** |
| Abdur Rahman | `rahman@yopmail.com` | vendor | Vendor **Rahman Pump Service** |
| Amin Hossain | `amin@yopmail.com` | vendor | Vendor **Uttara Electric** |

After invites: each person signs in once with **`Pass@123`**.

**5. Demo request flow (must include Confirm AI)**

1. **Karim** — `/resident/new` → `bathroom light flickering, urgent — cannot see at night` → Submit.
2. **Hasan or Noor (Board)** — open request → **Acknowledge now** → **Confirm AI** (or override urgency to **Urgent**) → **Assign** vendor (**Uttara Electric**).
3. **Amin** — `/vendor` → job → **Mark done** + cost **850** ৳.
4. **Karim** — `/inbox` → **Verify now** → **Verify work**.
5. **Rina** — `/committee` → Uttara Electric spend includes 850 ৳; no Board in nav.

## Routes

| Path | Who can open |
| --- | --- |
| `/` | Everyone (sign-in) |
| `/resident`, `/resident/new`, `/resident/requests/[id]` | Resident |
| `/staff`, `/staff/requests/[id]` | Staff, **admin** |
| `/committee`, `/committee/vendors/[id]`, `/committee/decisions/[id]` | Committee, admin |
| `/committee/registry` | Committee, admin |
| `/vendor`, `/vendor/jobs/[id]` | Vendor |
| `/inbox`, `/account` | All desk roles |

## Manual testing (QA checklist)

Sign out between each person. Password for every demo account: **`Pass@123`**.

**Visual cues:** new submitted requests use **teal/courtyard** background + **New** badge. Unread alerts use the same teal wash + left bar.

### Karim → close (full flow)

| Step | Login | Do | Pass if |
| --- | --- | --- | --- |
| 1 | `karim@yopmail.com` | `/resident/new` → message → Submit | Lands on `/resident/requests/{uuid}` (not `req-…`) |
| 2 | Karim | Back to `/resident` | Card shows **New** + teal background |
| 3 | `hasan@yopmail.com` | `/staff` | Same request under board with **New** styling |
| 4 | Hasan | Open request → **Acknowledge now** → **Confirm AI** | Status Acknowledged; AI confirmed |
| 5 | Hasan | **Assign** vendor (Metro Lift → Rafiq; electrical/water → **Amin / Uttara Electric**) | Vendor gets alert |
| 6 | `rafiq@yopmail.com` or `amin@yopmail.com` | `/vendor` → open job | Job visible |
| 7 | Hasan or vendor | **Mark done** + cost (e.g. 850) | Status Awaiting verification; cost shows ৳850 |
| 8 | Karim | `/inbox` → teal **New** alert → **Verify now** | Verify panel shows |
| 9 | Karim | **Verify work** | Verified closed |
| 10 | `rina@yopmail.com` | `/committee` | Cost on desk; **no Board** in nav |

### Admin → urgent electrical (full operator path)

Sign out between each person. Use message **without** “leak” (that triggers emergency):  
`bathroom light flickering, urgent — cannot see at night`

| Step | Login | Do | Pass if |
| --- | --- | --- | --- |
| 1 | `noor@yopmail.com` | `/committee/registry` | Building **Uttara Heights**, flats, vendors, people (see Fresh start) |
| 2 | Admin | All eight people invited + IAM roles | Each shows **Active** in Registration |
| 3 | `karim@yopmail.com` | `/resident/new` → message above → Submit | UUID detail; AI **urgent** (not emergency) |
| 4 | `noor@yopmail.com` or Hasan | `/staff` → request under **Urgent** → **Confirm AI** | Teal **New**; AI confirmed |
| 5 | Hasan | Acknowledge → assign **Uttara Electric** | Assigned |
| 6 | `amin@yopmail.com` | `/vendor` → job → **Mark done** + **850** ৳ | Awaiting verification |
| 7 | Karim | `/inbox` → **Verify now** → **Verify work** | Verified closed |
| 8 | `rina@yopmail.com` | `/committee` | Uttara Electric spend includes 850; **no Board** |
| 9 | Admin | Nav includes **Board** + Registration | Operator superset |

### Other FR-7 cases

1. **Nusrat / 7-B lift** — same lifecycle with `nusrat@yopmail.com`.
2. **Pump story** — Rina’s desk: six Rahman repairs · ৳38,500 + replace decision.
3. **Registration** — Rina or admin edits building at `/committee/registry`.

**Global pass:** role in header; wrong role redirected; resident cannot close without verify; emergency terracotta on staff board; committee has no Board link.

## Project structure

```
src/
  app/           Next.js routes (one folder per role)
  components/    layout, requests, triage, committee, ui
  features/      board grouping, spend rollups, AI proposals
  data/          seed data and checks
  lib/           Blocks client, session, store
  types/         domain types
blocks/          Blocks CLI workspace (schemas, rules)
```

Routes live in `src/app/<role>/`. Domain logic lives in `src/features/`. Pages stay thin.

## Blocks

- **Tenant:** `D975c4874bd6b47b995cce54f926c09cc`
- **CLI account:** `noor` (`noor.mohammad@selisegroup.com`)
- **App domain:** `https://dbsblo.slsblx.com`
- **SDK:** `@seliseblocks/client` — never raw `fetch` to Blocks APIs

See [`AGENTS.md`](./AGENTS.md) for Blocks skill routing and CLI rules.
