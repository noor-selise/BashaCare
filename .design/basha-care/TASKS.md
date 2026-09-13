# Build Tasks: BashaCare

Generated from: `.design/basha-care/DESIGN_BRIEF.md`  
Date: 2026-09-13

Blocked for cloud IAM/Data/Storage until project `D975c4874bd6b47b995cce54f926c09cc` is shared with this account, or a new `BashaCare` project is created with explicit terms consent. UI tasks can start against a local typed store that mirrors the intended schemas.

## Foundation
- [x] **Tokenized shell**: Next.js App Router at repo root using Scandinavian civic tokens from `DESIGN_TOKENS.css` / `DESIGN.md` (Fraunces, Figtree, Noto Sans Bengali, paper canvas, courtyard teal). Home `/` is a building entry, not a SaaS hero. _New: AppShell, SiteHeader, theme toggle. Reuses: DESIGN.md._
- [x] **Session + role gate**: Demo impersonation for four roles that redirects to the role home and never shows finance to residents/vendors. Wire `src/lib/blocks/client.ts` as an empty-safe client (no invented keys). _New: session context. Depends on: tokenized shell._

## Core UI
- [x] **Resident inbox + composer**: `/resident` and `/resident/new` — message-first Bangla-capable compose, optional photo, list of own requests only. Seed includes 7-B lift. _New: RequestComposer, RequestCard. Depends on: session._
- [x] **Request detail + status rail**: `/resident/requests/[id]` with lifecycle rail, evidence, and Verify when awaiting verification. Cannot close without verify. _New: StatusRail, EvidenceStrip._
- [x] **Staff board**: `/staff` with full-bleed emergency banner, pinned 10-A shaft leak, then urgent, then routine. _New: StaffBoard, EmergencyBanner._
- [x] **Staff triage + AI panel**: `/staff/requests/[id]` shows category, urgency + reason, draft reply. Confirm applies; override records a downgrade/upgrade. Assign vendor, attach after photo. _New: AiSuggestionPanel._
- [x] **Committee desk**: `/committee` answers three questions on one screen: open urgents, slow vendor, spend. Pump case: six repairs, ৳38,500, replace recommendation. _New: SpendChart, VendorScore, ReplaceFlag._
- [x] **Vendor jobs**: `/vendor` and `/vendor/jobs/[id]` — assigned work and evidence only. No costs, no other vendors. _Reuses: RequestCard, EvidenceStrip._

## Interactions & States
- [x] **Lifecycle + notifications**: Status changes write a timeline event; inbox shows role-scoped alerts. Covers: empty, busy, error, emergency pulse (disabled when reduced-motion).
- [x] **Blocks workspace files**: `blocks init` at repo root; author request/vendor/cost schemas locally. Push only after a reachable tenant is selected. _Depends on: tenant access._

## Responsive & Polish
- [ ] **375 / 768 / 1024**: Resident bottom tabs; staff/committee header + drawer; committee three-up becomes a stack. Line length 45–75ch.
- [ ] **Accessibility pass**: WCAG 2.1 AA, 44px targets, 16px inputs, status never color-only, keyboard through composer and verify.

## Review
- [ ] **Design review**: Run /design-review against the brief once pages render.
