# Business Requirements Document: BashaCare

**Product:** BashaCare — apartment maintenance and resident requests  
**Building:** 12-storey, 48-flat building in Uttara, Dhaka  
**Source:** `BashaCare.pdf`  
**Date:** 2026-09-13 (revalidated)  
**Status:** Decisions locked. Feasibility re-checked against live Blocks account after official skill bootstrap.  
**Blocks project:** BashaCare, `D975c4874bd6b47b995cce54f926c09cc` (dev), selected as CLI account `noor` (`noor.mohammad@selisegroup.com`). App domain `https://dbsblo.slsblx.com`. Do not substitute another tenant.

## 1. Problem

Maintenance, complaints, vendor calls, and bills currently live in the building caretaker's personal phone. Residents report problems into a void. Urgent incidents (water in the lift shaft) get the same treatment as garden trimming. The committee approves bills with no view of vendor speed or where money goes.

Cost of that failure: a two-day lift outage strands elderly residents; ৳40,000+/year is wasted on a pump that should be replaced; opacity is a re-election and resale risk.

## 2. Users and jobs

| Persona | Job to be done | Frustration |
|---------|----------------|-------------|
| Resident (flat 7-B) | Get a problem fixed and know the status | Reported 3 weeks ago, no reply |
| Caretaker / building manager | Triage, assign, close with evidence | Everything in his head and call log |
| Committee (treasurer, secretary) | Budget, vendors, accountability | Approves bills blind |
| Vendor (lift AMC, plumber, electrician) | Do assigned work with a clear job | Blamed, rarely given a written job |

**80% time page:** caretaker triage board (operations hub). Residents visit in bursts. Committee visits for spend and vendor decisions.

## 3. Grill decisions (locked)

| Question | Decision | Why |
|----------|----------|-----|
| One building or a platform? | One building: Uttara Heights | The case is a single 48-flat building. Multi-tenant SaaS is out of scope. |
| Vendor portal? | Slim assigned-work view | PDF marks vendors optional. We exercise the access rule without building a second product. |
| Maintenance fee / payments? | Out of scope | Fee (৳2,500) is context, not a must-do. |
| UI language? | English chrome, Bangla-capable content | Residents write Bangla. Staff and committee work in English. |
| Notifications? | In-app banners + inbox | Emergency must be visually louder. SMS/WhatsApp later. |
| Auth for the demo? | Blocks hosted login on this tenant; demo role switcher as the desk fallback | Invite `noor.mohammad@selisegroup.com` as System User. Resident/staff/committee/vendor IAM roles are not defined yet. |
| Framework? | Next.js at repo root, wired as an existing Blocks app | User asked for Next.js. Official `blocks new web` is still Vite. Existing-app skill owns the wire-up. |
| Folder layout? | Single Next.js app at repo root + `blocks/` + role-grouped `src/app` | One app, four role surfaces. No monorepo until a second app exists. |
| AI? | Heuristic + history, staff confirm | Propose category, urgency + reason, draft reply. Staff can upgrade/downgrade. Flag Nth repair vs replace. |
| Nav depth? | Two levels max | Resident / staff / committee / vendor each have a home + a detail. |

## 4. Functional requirements

### FR-1 Identity and access
- FR-1.1 Distinct sign-in (or demo impersonation) for resident, caretaker/staff, committee, and vendor.
- FR-1.2 Residents see only their own flat's requests and updates. Never other flats. Never finances.
- FR-1.3 Costs, vendor performance, and committee decisions are visible to committee and managers only.
- FR-1.4 Vendors see only work assigned to them.
- FR-1.5 Role is visible in the chrome at all times so a demo cannot silently leak the wrong data.

### FR-2 Resident request
- FR-2.1 Resident reports a problem as a message (not a form-first flow), optionally with a photo.
- FR-2.2 System creates a structured request: status, assignment, evidence, timestamps.
- FR-2.3 Resident sees only their own requests and the status of each, from submitted to verified-closed, without calling anyone.
- FR-2.4 Resident confirms the work was actually done before a request can close.

### FR-3 Staff triage and work
- FR-3.1 Staff see a board of open work with emergency items visually escalated (red flag, faster acknowledgement cue).
- FR-3.2 Staff assign a request to a vendor or in-house staff.
- FR-3.3 Staff update progress and attach before/after photo evidence.
- FR-3.4 Urgent incidents acknowledge faster and stay pinned until acknowledged.
- FR-3.5 Routine jobs queue normally and do not steal the emergency visual language.

### FR-4 Lifecycle
Statuses, in order:

1. Submitted
2. Acknowledged
3. Assigned
4. In progress
5. Awaiting verification
6. Verified closed

Staff may reject with a reason. Closed requires resident verification except where the resident is unavailable and committee overrides (not in v1 demo).

### FR-5 Cost and committee
- FR-5.1 Every completed job can record a cost and a spend category.
- FR-5.2 Committee sees spend by category and by vendor over time.
- FR-5.3 Committee sees vendor performance: response time, repeat jobs, total billed.
- FR-5.4 One committee screen answers: which vendor is slow, what they cost, and which urgent incidents are open now.

### FR-6 AI assistance
- FR-6.1 On an incoming resident message, AI proposes category, urgency with a stated reason, and a draft reply.
- FR-6.2 Nothing is applied or sent until staff confirm or adjust.
- FR-6.3 Demo includes at least one case where staff sensibly downgrade or upgrade the AI urgency call.
- FR-6.4 AI looks across a vendor's job history and flags when a "routine" repair is the Nth patch on the same equipment, with a repair-vs-replace recommendation to the committee.

### FR-7 Scripted demo case
- FR-7.1 Routine: flat 7-B reports a lift fault with a photo → caretaker triages → lift AMC assigned → resident watches status → work done with photo → resident verifies → closed.
- FR-7.2 Emergency: flat 10-A reports water leaking into the lift shaft. Path diverges: faster acknowledgement, escalation, red banner.
- FR-7.3 Close on committee view: six pump repairs in five months totaling ৳38,500 from one vendor, and a recorded decision to replace instead of repair.

## 5. Non-functional requirements

### NFR-1 Security and privacy
- Row-level isolation by flat for residents; by vendor for vendors.
- No finance data on resident or vendor surfaces.
- No secrets, tokens, or client secrets in the frontend or git.
- Blocks access only through `@seliseblocks/client`, never raw `fetch` against Blocks APIs.

### NFR-2 Accessibility
- WCAG 2.1 AA: 4.5:1 text contrast, 3:1 for large text and UI chrome.
- Keyboard operable. Focus visible. Touch targets ≥ 44×44px.
- Status is never color-only (label + icon + color).
- `prefers-reduced-motion` disables decorative motion.

### NFR-3 Localization and script
- Bengali resident messages render correctly (Noto Sans Bengali).
- Taka amounts use ৳ and en-BD grouping.
- Dates use a building-local, human format (not raw ISO in the UI).

### NFR-4 Performance
- First contentful paint of role homes under 2.5s on a mid-range phone.
- Board and dashboard work from local/seeded data with no layout shift on first paint.
- Images lazy-load; photo evidence is compressed before attach in a later slice (v1 accepts file objects).

### NFR-5 Reliability and audit
- Every status change is an append-only timeline event.
- Costs cannot be silently edited after close without a new event (v1: display-only after close).
- Demo seed is deterministic so the scripted case always exists.

### NFR-6 Operability
- App runs locally with `npm run dev` and no live Blocks project.
- `blocks init` owns local schema/workspace files.
- Connecting a real Blocks tenant is additive (env + OIDC), not required to run the demo.

### NFR-7 Devices
- Mobile-first. Resident flows must work at 375px.
- Staff and committee boards add columns from 768px / 1024px.
- No horizontal overflow of primary navigation.

## 6. Out of scope (v1)

- Online payment of the ৳2,500 maintenance fee
- Multi-building / multi-tenant SaaS
- SMS, WhatsApp, or email delivery
- Native mobile apps
- Live OIDC against a deleted leftover tenant
- Committee voting / AGM workflows
- Inventory / spare-parts store

## 7. Success criteria

- A resident can report in Bangla, attach a photo, and watch status without calling anyone.
- An emergency is visibly different from a routine job on the staff board within one glance.
- A request cannot close until the resident verifies.
- A committee member can answer, on one screen: which vendor is slow, what they cost, and which urgent incidents are open.
- The pump case shows six repairs / ৳38,500 and a replace decision.
- Staff can override an AI urgency call, and that override is visible.

## 8. Feasibility (revalidation)

| Capability | Feasible on Blocks? | How | Risk |
|------------|---------------------|-----|------|
| Four roles + row isolation | Partial | Demo actors for now; only `clouduser` exists in IAM | Add resident/staff/committee/vendor roles before row policies |
| Request lifecycle + evidence | Yes | Data schema + Data Storage photos | Storage provider may be unset on a new tenant |
| Emergency vs routine | Yes, app-owned | Urgency field + Notifier + UI path | Notifier/mail config often missing on fresh tenants |
| Cost + vendor performance | Yes | Job cost fields + GraphQL/aggregation in app | No warehouse. Rollups are app queries. |
| Resident Bangla messages | Yes | Store raw text; Noto Sans Bengali in UI | Localization modules are for chrome, not free text |
| AI category/urgency/reply | Partial | App-side heuristic or external model. Blocks has no request-triage AI product. | Staff must confirm. Do not block submit on AI. |
| Repair-vs-replace from history | Partial | App query of vendor+equipment jobs | Same: not a Blocks feature. Deterministic seed proves the demo. |
| Next.js + hosted login | Yes, extra work | Existing-app + OIDC + local HTTPS on the project domain | `blocks new web` will not generate Next.js. Do not convert a Vite scaffold. |
| Live tenant `D975c4…09cc` | **Yes** | Selected as BashaCare dev under account `noor` | Do not use `test` / `t20` / `VendorGate` as a substitute |

**Build order:** local demo store still runs the scripted walkthrough. Hosted login and Data schemas are live on this tenant. Deploy waits for the GitHub connection.

## 9. Assumptions

1. Single building named Uttara Heights, 48 flats, 12 storeys.
2. Demo users: resident 7-B (Nusrat), resident 10-A (Karim), caretaker (Hasan), treasurer (Rina), lift vendor, pump vendor.
3. Cloud writes wait until `D975c4874bd6b47b995cce54f926c09cc` is shared **or** the user approves `blocks projects create "BashaCare"`.
4. AI is a transparent, staff-confirmed assistant — not autonomous close/send.
5. Official skill source of truth is `.codex/skills/`. Cursor also has a copy at `.cursor/skills/`.
→ Correct these if they are wrong.
