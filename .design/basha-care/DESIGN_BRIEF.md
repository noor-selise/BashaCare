# Design Brief: BashaCare

## Problem

A resident in Uttara reports a leaking lift or a dead pump and then waits. There is no ticket, no status, no one who can say when it will be fixed. The caretaker is a human inbox. The committee signs bills in the dark. Urgent and routine feel the same.

## Solution

BashaCare is the building's shared operations desk. A resident writes the way they already write — often in Bangla, often messy — and gets a living request with a status. Staff triage with AI as a suggestion, not a verdict. Emergencies turn the board red. The committee sees spend, vendor speed, and open urgents on one screen.

## Experience Principles

1. **Status over conversation** -- The product exists so nobody has to call to ask "ki hoise?" Every request has a visible state.
2. **Urgent looks urgent** -- Emergency is a different path, not a different badge color on the same card. Routine must stay quiet so red still means red.
3. **Evidence before close** -- Work is not done because a vendor said so. A photo and a resident verify close the loop.

## Aesthetic Direction

- **Philosophy:** Scandinavian civic — warmth plus restraint, like a well-run municipal desk that still feels like home.
- **Tone:** Calm, accountable, slightly formal. Never hospital-clinical. Never purple SaaS.
- **Reference points:** A Linear-grade ops board (density, hierarchy) with a civic paper palette; apartment notice-board typography; Dhaka evening terracotta.
- **Anti-references:** Property-management greige, Inter-on-white dashboards, purple gradients, cartoon "smart home" illustration, dark-mode-first developer tools.

## Existing Patterns

Greenfield app (no Next.js tree yet). Official Blocks skills are vendored at `.codex/skills/` (Cursor copy at `.cursor/skills/`). Tokens live in `.design/basha-care/DESIGN_TOKENS.css`. Visual language is `/DESIGN.md`. Folder contract is in `INFORMATION_ARCHITECTURE.md`.

Live project `D975c4874bd6b47b995cce54f926c09cc` is **not** reachable from the current CLI account — do not design around another tenant's domain or schemas.

- Typography: Fraunces (display) + Figtree (UI) + Noto Sans Bengali (resident voice)
- Colors: paper, courtyard teal, terracotta emergency, charcoal ink
- Spacing: 4px base, 8px rhythm
- Components: all new

## Component Inventory

| Component | Status | Notes |
| --------- | ------ | ----- |
| SiteHeader | New | Building mark, role, nav, emergency pulse |
| RoleGate | New | Demo impersonation; later Blocks OIDC |
| RequestComposer | New | Message-first, photo attach |
| RequestCard | New | Status, urgency, flat, age |
| StatusRail | New | Lifecycle steps |
| StaffBoard | New | Emergency pin + routine queue |
| AiSuggestionPanel | New | Category, urgency reason, draft reply, override |
| EvidenceStrip | New | Before / after photos |
| SpendChart | New | Category + vendor rollup |
| VendorScore | New | Response, repeats, billed |
| ReplaceFlag | New | Repair-vs-replace callout |
| Empty / Error / Busy | New | Required on every list |

## Key Interactions

- Resident submits a message → request appears as Submitted with AI draft waiting for staff.
- Staff opens a request → AI panel is visible; confirm applies category/urgency/reply; override records who changed what.
- Emergency lands → red building banner + pinned row; acknowledge is the first action.
- Vendor/staff attach after photo → status becomes Awaiting verification; resident sees Verify.
- Resident verifies → Verified closed; cost becomes committee-visible.
- Committee opens home → three answers: slow vendor, cost, open urgents. Pump case shows replace recommendation.

## Responsive Behavior

- 375px: single column. Resident composer and request list. Staff board is a stacked emergency list then routine. Committee metrics stack.
- 768px: staff split (list + peek). Committee two-column metrics.
- 1024px+: staff board with detail pane. Committee three-up "great" screen.
- Role switcher becomes a menu on mobile. Bottom utility bar for resident (Home, New, Alerts).

## Accessibility Requirements

- WCAG 2.1 AA contrast.
- Urgency uses word + icon + color.
- Composer inputs are 16px to avoid iOS zoom.
- Dialogs trap focus. Timeline is an ordered list.
- Reduced motion: no pulse on the emergency banner.

## Out of Scope

Payments, multi-building, SMS, native apps, live OIDC against a missing tenant, illustration-heavy marketing pages.
