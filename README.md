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

## Roles

Each signed-in user needs a **Blocks IAM role** and a matching **`Person` row**. IAM role alone shows “No desk for this account”.

| Role | Home | What they do |
| --- | --- | --- |
| **Admin** | `/committee` | Seed data, Registration, full desk access |
| **Committee** | `/committee` | Spend desk, vendor performance, Registration |
| **Staff** | `/staff` | Triage board, assign vendors, attach evidence |
| **Resident** | `/resident` | Report problems, track status, verify closure |
| **Vendor** | `/vendor` | Assigned jobs only — no finances |

### Demo accounts

Hosted login: `https://dbsblo.slsblx.com`

| Email | Role | Notes |
| --- | --- | --- |
| `noor.mohammad@selisegroup.com` | admin | Live tenant admin |
| `nusrat@yopmail.com` | resident | Flat 7-B |
| `karim@yopmail.com` | resident | Flat 10-A · seeded emergency `req-10a-shaft` |
| `hasan@yopmail.com` | staff | Caretaker |
| `rina@yopmail.com` | committee | Treasurer |
| `rafiq@yopmail.com` | vendor | Metro Lift AMC |
| `rahman@yopmail.com` | vendor | Rahman Pump Service |

Demo emails must be invited on the tenant with the matching IAM role and `Person` row (via `/committee/registry` or seed on first admin login).

## Routes

| Path | Access |
| --- | --- |
| `/` | Sign-in landing |
| `/resident`, `/resident/new`, `/resident/requests/[id]` | Resident |
| `/staff`, `/staff/requests/[id]` | Staff |
| `/committee`, `/committee/vendors/[id]`, `/committee/decisions/[id]` | Committee, admin |
| `/committee/registry` | Admin, committee — building, flats, people, vendors |
| `/vendor`, `/vendor/jobs/[id]` | Vendor |
| `/inbox` | Role-scoped alerts |
| `/account` | All desk roles — profile, photo |

## Building data

| Surface | Who sees it |
| --- | --- |
| Header subtitle | All signed-in roles — live `Building.name` |
| `/committee/registry` | Admin, committee — edit building record |
| Resident home | Assigned flat only |
| Staff board / Committee desk | Full flat roster (fee on committee desk only) |

Admin seeds `Building`, `Flat`, and `Person` rows on first login when collections are empty.

## Manual testing

Sign out between personas. Full scripted cases are in **BRD §7 (FR-7)**.

1. **Routine lift (7-B)** — Nusrat submits → Hasan triages and assigns → Rafiq uploads evidence → Hasan marks done → Nusrat verifies → Rina sees cost on desk.
2. **Emergency shaft (10-A)** — Karim’s seeded request → Hasan acknowledges first → red banner stays until handled.
3. **Pump story** — Rina’s desk shows six Rahman Pump repairs (৳38,500) and the replace decision.
4. **Registration** — Admin or Rina edits building, adds a flat, invites a person.
5. **Account** — Upload profile photo (required on hosted tenant), check `/inbox` lifecycle links.

**Pass:** role always visible in header; wrong role redirects home; resident must verify before close; emergency visually distinct on staff board.

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
