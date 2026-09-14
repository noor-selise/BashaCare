# Admin vs Committee — Role Split

**Status:** Approved  
**Date:** 2026-09-14  
**Relates to:** `BRD.md` §2 (users), FR-1.3, FR-3, FR-5; building-registration spec §3.2

## 1. Problem

Committee (treasurer) and admin (Blocks System User) shared identical nav: Desk, Registration, **Board**, Alerts, Account. The BRD treats committee as a **governance** persona (budget, vendors, accountability) and staff as **operations** (triage, assign, evidence). Admin is a **tenant operator** (seed, IAM, override) — not a building treasurer.

Letting Rina open the staff Board blurs audit lines (“who acknowledged the emergency?”) and weakens the five-role demo.

## 2. Decision (brainstorming option B)

| Role | Desk | Registration | Board (staff triage) |
| --- | --- | --- | --- |
| **Committee** | ✓ read spend/vendors/urgencies | ✓ write (building, flats, invites) | ✗ |
| **Admin** | ✓ | ✓ | ✓ (+ seed, all alerts, route bypass) |

Committee cannot grant `admin` IAM role from Registration (unchanged — portal/System User only).

## 3. Implementation

- **Nav:** `site-header.tsx` — remove Board link for `committee`; keep for `admin`.
- **Routes:** No new URLs. `AppShell` already redirects non-allowed roles; admin bypasses `allow`.
- **Data:** No schema or IAM changes in this slice.

## 4. Testing

1. Rina — nav shows Desk, Registration, Alerts, Account only; `/staff` redirects to `/committee`.
2. Admin — Board still in nav; can triage on staff routes.
3. FR-7 — Hasan triages on Board; Rina sees pump spend on Desk only.

## 5. Non-goals

- Split Registration read/write between committee and admin (both keep write per option B).
- Committee voting / AGM workflows.
- Data gateway row policies by role (still deferred).
