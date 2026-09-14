# BashaCare

Apartment maintenance desk for Uttara Heights. Next.js App Router. Product spec in `BRD.md`. Visual system in `DESIGN.md`.

```
npm install
npm run check:seed
npm run cert
npm run dev
```

Open `https://dbsblo.slsblx.com` — not localhost. `npm run dev` starts Next on `127.0.0.1:3000` and the HTTPS proxy on 443. First sudo on a machine grants this Node binary `cap_net_bind_service` so later runs do not ask again. First time on a machine: add `127.0.0.1 dbsblo.slsblx.com` to `/etc/hosts`, then `npm run cert`.

Blocks project is BashaCare (`D975c4874bd6b47b995cce54f926c09cc`). Fill `.env.local` from `blocks projects get` and `blocks auth oidc-clients list` only. The public OIDC callback is `https://dbsblo.slsblx.com/login/callback`.

```
blocks init
```

## Folder structure

```
BashaCare/
  BRD.md DESIGN.md README.md     product + visual source of truth
  .design/basha-care/            brief, IA, tokens, spec, tasks
  blocks/                        Blocks CLI workspace
  src/
    app/                         routes — one folder per role URL
    components/
      layout/                    shell, header, emergency banner
      requests/                  card, composer, evidence, status rail
      triage/                    staff AI panel
      committee/                 treasurer desk
      ui/                        button, empty state
    features/
      requests/                  board grouping, status order
      spend/                     vendor cost rollups
      ai/                        category / urgency proposal
    data/                        seeded building, seed check
    lib/
      blocks/                    single Blocks client
      session/                   role home
      store.tsx                  demo session + request lifecycle
      format.ts money.ts cn.ts
    types/                       domain types
```

Routes stay in `src/app/<role>/`. Domain math stays in `src/features/`. Pages stay thin.

## Building — where it shows and who sees it

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

**Who manages the building record?** Admin and committee via Registration. Admin also seeds `Building` / `Flat` / `Person` rows on first login when collections are empty.

## Demo cast — users, roles, and what to test

Hosted login at `https://dbsblo.slsblx.com`. Each account needs **both** a Blocks IAM role **and** a matching `Person` row. IAM role alone opens "No desk for this account".

| Email | IAM role | Person | Home after login | Primary activities |
|-------|----------|--------|------------------|-------------------|
| `noor.mohammad@selisegroup.com` | `admin` | Live admin (not in seed cast) | `/committee` | Seed building data on first login; Registration (building, flats, people, vendors); Desk + Board + Alerts; full request visibility |
| `noor@yopmail.com` | `admin` | Noor Mohammad · Admin | `/committee` | Same as admin (seed cast; use if invited on tenant) |
| `nusrat@yopmail.com` | `resident` | Nusrat Rahman · Flat **7-B** | `/resident` | View own requests; **New request** with message + photo; watch status rail; **Verify work** when awaiting verification |
| `karim@yopmail.com` | `resident` | Karim Hossain · Flat **10-A** | `/resident` | Same as resident; seeded **emergency** request `req-10a-shaft` (water in lift shaft) |
| `hasan@yopmail.com` | `staff` | Hasan Mia · Caretaker | `/staff` | **Board**: emergencies → urgent → routine; open request → acknowledge → confirm/override AI → assign vendor → attach after photo + cost → mark done |
| `rina@yopmail.com` | `committee` | Rina Chowdhury · Treasurer | `/committee` | **Desk**: open urgencies, slow vendors, spend by category/vendor, pump replace decision (six repairs · ৳38,500); Registration; read-only Board |
| `rafiq@yopmail.com` | `vendor` | Rafiq Uddin · Metro Lift AMC | `/vendor` | Jobs assigned to **metro-lift** only; attach after photo; no finances or other vendors' work |
| `rahman@yopmail.com` | `vendor` | Abdur Rahman · Rahman Pump Service | `/vendor` | Jobs assigned to **rahman-pump** only (seed includes six closed pump patches) |

**Data isolation checks**

- Resident sees only requests where `residentId` matches their email.
- Resident roster shows only the assigned flat; staff/committee/admin see every registered flat; vendor sees only flats on assigned jobs.
- Maintenance fee (৳) appears on committee/admin Desk roster only — never resident, vendor, or staff Board.
- Vendor sees only requests where `vendorId` matches their vendor assignment.
- Staff, committee, and admin see all requests; money fields hidden from resident and vendor cards.
- Admin sees every notice in Alerts; other roles see `role: all` or their own role.

## Manual test flows (BRD FR-7)

Run at `https://dbsblo.slsblx.com`. Sign out between personas (header → Sign out).

### A — Routine lift (flat 7-B)

1. **Nusrat** (`nusrat@yopmail.com`) → `/resident` — open seeded lift emergency `req-7b-lift` or submit a new request from `/resident/new`.
2. **Hasan** (`hasan@yopmail.com`) → `/staff` — emergency row pinned; open detail → **Acknowledge** → review AI panel → confirm or override urgency → **Assign** Metro Lift AMC.
3. **Rafiq** (`rafiq@yopmail.com`) → `/vendor` — job appears → open → attach after photo → (staff marks done).
4. **Hasan** → mark done with cost → status **Awaiting verification**.
5. **Nusrat** → request detail → **Verify work** → **Verified closed**.
6. **Rina** (`rina@yopmail.com`) → `/committee` — cost visible in vendor/spend rollups.

### B — Emergency shaft leak (flat 10-A)

1. **Karim** (`karim@yopmail.com`) → `/resident/requests/req-10a-shaft` — emergency message + before photo.
2. **Hasan** → `/staff` — red emergency banner; acknowledge first; triage before routine queue.
3. Continue assign → vendor → verify same lifecycle as A; emergency stays visually louder throughout.

### C — Committee pump story (no new login steps)

1. **Rina** → `/committee` — six Rahman Pump repairs totaling ৳38,500; **Replace the roof pump** decision on desk.
2. Confirm vendor page shows repeat jobs and replace recommendation.

### D — Registration and building edit

1. **Admin or Rina** → `/committee/registry`.
2. Edit **Building** panel (name, address, storeys, flats, fee) → Save → confirm header subtitle updates on next navigation.
3. Add a flat; invite a test resident (creates IAM user + Person row); confirm People list shows Active/Pending.

### E — Account and alerts

1. Any role → `/account` — edit display name, title, profile photo (required on hosted tenant before save).
2. **Hasan** → `/inbox` — staff alerts for new requests; link label follows live request status.
3. After mark done → **Nusrat** inbox shows verify prompt.

**Pass criteria:** role visible in header at all times; wrong role cannot stay on another role's URL (redirects to own home); resident cannot close without verify; emergency visually distinct on staff board; committee answers slow vendor + spend + open urgencies on one screen.
