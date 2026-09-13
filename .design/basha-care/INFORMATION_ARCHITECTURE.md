# Information Architecture: BashaCare

Revalidated 2026-09-13 after official Blocks bootstrap. URLs stay role-prefixed. Folder layout below is the build contract.

## Site Map

- Home `/` — building entry, role chooser
- Sign in `/login` — demo role (Blocks OIDC when configured)
- Resident
  - My requests `/resident`
  - New request `/resident/new`
  - Request `/resident/requests/[id]`
- Staff (caretaker)
  - Board `/staff`
  - Request `/staff/requests/[id]`
- Committee
  - Desk `/committee` — the 80% committee screen
  - Vendor `/committee/vendors/[id]`
  - Decision `/committee/decisions/[id]`
- Vendor
  - Assigned jobs `/vendor`
  - Job `/vendor/jobs/[id]`
- Notifications `/inbox` — in-app only, role-scoped
- Account `/account` — who I am, which flat / role

## Navigation Model

- **Primary navigation:** role-specific, maximum five items.
  - Resident: Requests, New, Alerts
  - Staff: Board, Alerts
  - Committee: Desk, Vendors, Alerts
  - Vendor: Jobs, Alerts
- **Secondary navigation:** none. Detail pages use a back link + status rail.
- **Utility navigation:** building name, current role, switch-role (demo), help (short).
- **Mobile navigation:** resident gets a bottom tab bar (Requests / New / Alerts). Staff, committee, and vendor use a header + drawer. Hamburger is acceptable for those three; not for residents.

## Content Hierarchy

### Home `/`
1. Building name and one-line promise -- trust before login
2. Role entry -- the only action
3. Quiet proof (48 flats, request statuses, emergency vs routine) -- below the fold

### Resident home
1. Open requests with status -- "what is happening to my problem"
2. Compose / new request -- next most frequent
3. Recently closed -- reassurance
4. Building notices -- secondary

### Resident request detail
1. Status rail -- the reason they opened the page
2. Their message and photo
3. Staff/vendor updates and evidence
4. Verify work CTA when awaiting verification

### Staff board
1. Unacknowledged emergencies -- must win the first glance
2. Open urgent queue
3. Routine queue
4. Filters (vendor, category) -- secondary

### Staff request detail
1. Urgency + flat + age
2. AI suggestion (confirm / override)
3. Assign + progress + evidence
4. Timeline

### Committee desk
1. Open urgent incidents
2. Vendor who is slow (response + repeats)
3. Spend by vendor / category (৳)
4. Repair-vs-replace flags -- the pump story

### Vendor jobs
1. Assigned open jobs
2. Job brief + evidence upload
3. Nothing else (no finances, no other vendors)

## User Flows

### Report a routine problem
1. Resident lands on `/resident`
2. Sees their open list and a compose path
3. Writes a message, attaches a photo, submits
   - If AI can classify -> draft stored, not applied
   - If photo missing -> still allowed
4. Arrives at `/resident/requests/[id]` in Submitted

### Emergency divergence
1. Resident 10-A submits a lift-shaft leak (or staff marks emergency)
2. Staff board shows a red building banner and a pinned row
3. Staff acknowledges (faster SLA)
   - If ignored -> banner stays
4. Assignment and evidence follow the same lifecycle, visually louder

### Triage with AI override
1. Staff opens a new request
2. Sees proposed category, urgency + reason, draft reply
3. Staff confirms or changes urgency
   - If override -> reason recorded, resident sees the human reply
4. Vendor assigned, resident status updates

### Verify and close
1. Staff/vendor attach after photo and mark work done
2. Resident sees Awaiting verification + Verify
   - If resident verifies -> Verified closed
   - If resident rejects -> returns to In progress
3. Cost is visible to staff/committee

### Committee replace decision
1. Treasurer opens `/committee`
2. Sees six pump repairs, ৳38,500, same vendor, replace flag
3. Records "Replace, do not repair"
4. Decision sits on the case and the vendor page

## Naming Conventions

| Concept | Label in UI | Notes |
|---------|-------------|-------|
| Ticket / complaint | Request | Residents do not file "tickets" |
| Caretaker | Staff | Broader than one person; still the caretaker in the demo |
| Emergency / urgent / routine | Emergency, Urgent, Routine | Three levels. Emergency is the red path. |
| Closed after resident OK | Verified closed | "Closed" alone is a lie |
| Money spent on a job | Cost | Not "invoice" in v1 |
| Repair-vs-replace AI flag | Replace recommendation | A recommendation, not a purchase order |
| Building manager board | Board | Not "dashboard" for staff |
| Committee home | Desk | The one screen that answers three questions |
| Bangla resident text | Message | Not "description" or "details" |

## Component Reuse Map

| Component | Used on | Behavior differences |
|-----------|---------|---------------------|
| AppShell | All signed-in pages | Nav items swap by role |
| SiteHeader | All | Emergency pulse only when unacked emergencies exist for this role |
| RequestCard | Resident list, staff board, vendor jobs | Finance fields hidden from resident/vendor |
| StatusRail | All request details | Same states, different allowed actions |
| AiSuggestionPanel | Staff detail only | Hidden from residents |
| EvidenceStrip | Staff, vendor, resident detail | Resident is read-only until verify |
| Money | Staff detail (edit), committee (rollup) | Never on resident/vendor |
| EmptyState | Every list | Copy is role-specific |

## Content Growth Plan

- Requests accumulate: list pages paginate at 20, filter by status/urgency, search by flat or text.
- Vendor history is the growth surface for AI replace flags — query by equipment + vendor, not a new IA branch.
- Decisions archive on the vendor page, newest first.
- No CMS. Notices, if added later, are a flat list on resident home.

## Repository folder structure

One Next.js app at the **repo root**. No `apps/` monorepo until a second deployable exists. `blocks new web` is Vite — do not generate it inside this tree.

```
BashaCare/
  AGENTS.md                      repo + Blocks routing
  CLAUDE.md                      Blocks pointer only
  BRD.md
  DESIGN.md                      visual language
  change.md
  BashaCare.pdf
  .design/basha-care/            brief, IA, tokens, tasks
  .codex/skills/                 official skill source of truth
  .claude/skills/                Claude stubs → .codex
  .cursor/skills/                Cursor copy of .codex
  blocks/                        CLI workspace (from blocks init)
    data/schemas/
    data/rules/
    localization/
  src/
    app/                         Next.js routes = IA URLs
      page.tsx                   /
      login/
      resident/
      staff/
      committee/
      vendor/
      inbox/
      account/
    components/
      layout/                    AppShell, SiteHeader
      requests/                  card, rail, composer, evidence
      triage/                    AI panel
      committee/                 desk
      ui/                        button, empty
    features/
      requests/                  board grouping + status order
      spend/                     vendor rollups
      ai/                        propose + replace flag
    data/                        demo seed + seed check
    lib/
      blocks/client.ts           single createBlocksClient()
      session/                   role home
      store.tsx                  building session + request actions
      format.ts
      money.ts
      cn.ts
    types/
```

Rules:
- Routes stay in `src/app/<role>/…` so URLs match this IA.
- Domain logic lives in `src/features/`, not in page files.
- All Blocks SDK calls go through `src/lib/blocks/client.ts`.
- Schemas are authored under `blocks/` and pushed with the CLI. The UI never defines a second model.
- Do not put skills, briefs, or PDFs under `src/`.

## URL Strategy

- Pattern: `/<role>/<collection>/<id>`
- Dynamic segments: `id` for requests, vendors, jobs, decisions
- Query parameters: `status`, `urgency`, `q` on lists only
- No role in the query string for authorization — role comes from session
- Demo role switch changes session, then redirects to that role's home
