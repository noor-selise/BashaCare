# BashaCare — Manual QA

Use this checklist on **https://dbsblo.slsblx.com**. Sign out between each person.

**Password for every demo account:** `Pass@123`

**Visual cues:** new submitted requests = **teal/courtyard** background + **New** badge. Unread alerts = same teal wash + left bar. Emergency = **terracotta** full-bleed on staff board.

---

## Before you start (fresh tenant)

Only needed once, or when Registration is empty. Sign in as **`noor@yopmail.com`** (admin).

| # | Where | Action | Pass if |
| --- | --- | --- | --- |
| F1 | `/committee/registry` | Confirm building **Uttara Heights**, 12 storeys, 48 flats, fee **2500** ৳ | Facts match |
| F2 | Registry → Flats | **7-B** (floor 7), **10-A** (floor 10) | Both occupied |
| F3 | Registry → Vendors | Metro Lift AMC, Rahman Pump Service, **Uttara Electric** | All three listed |
| F4 | Registry → People | Eight invites (see roster below) | Each **Active** after first sign-in |

### Demo roster

| Name | Email | IAM role | Registration |
| --- | --- | --- | --- |
| Noor Mohammad | `noor@yopmail.com` | admin | — |
| Nusrat Rahman | `nusrat@yopmail.com` | resident | Flat 7-B |
| Karim Hossain | `karim@yopmail.com` | resident | Flat 10-A |
| Hasan Mia | `hasan@yopmail.com` | staff | — |
| Rina Chowdhury | `rina@yopmail.com` | committee | — |
| Rafiq Uddin | `rafiq@yopmail.com` | vendor | Metro Lift AMC |
| Abdur Rahman | `rahman@yopmail.com` | vendor | Rahman Pump Service |
| Amin Hossain | `amin@yopmail.com` | vendor | Uttara Electric |

---

## Flow A — Full lifecycle (staff path)

**Message (Karim):** any routine/urgent plumbing text, e.g. `QA — bathroom tap leaking slowly`

| # | Login | Do | Pass if |
| --- | --- | --- | --- |
| A1 | `karim@yopmail.com` | `/resident/new` → message → **Submit** | Lands on `/resident/requests/{uuid}` (not `req-…`) |
| A2 | Karim | `/resident` | Card shows **New** + teal |
| A3 | `hasan@yopmail.com` | `/staff` (Board) | Same request visible with **New** styling |
| A4 | Hasan | Open → **Acknowledge now** | Status **Acknowledged**; timeline updated |
| A5 | Hasan | Sidebar → **Confirm AI** (or change urgency → **Override AI**) | Toast confirms; sidebar becomes **read-only** (“AI suggestion — on record”); no second Confirm button |
| A6 | Hasan | **Assign** vendor (e.g. Rahman Pump Service) | Status **Assigned**; vendor gets alert |
| A7 | `rahman@yopmail.com` | `/vendor` → open job | Job listed |
| A8 | Hasan or vendor | **Mark done** + cost e.g. **500** ৳ | **Awaiting verification**; cost shows **৳500** |
| A9 | Karim | `/inbox` → teal alert → **Verify now** | Verify panel with **Verify work** / **Not done** |
| A10 | Karim | **Verify work** | **Verified closed**; moves to Recently closed |
| A11 | `rina@yopmail.com` | `/committee` | Spend includes 500 ৳; **no Board** in nav |
| A12 | Hasan or `noor@yopmail.com` | Re-open closed request on Board | AI sidebar **read-only**; no Assign / Mark done; message “Request is closed” |

---

## Flow B — Admin + urgent electrical (operator path)

**Message (Karim):** `bathroom light flickering, urgent — cannot see at night`  
(Do **not** use “leak” — that triggers **emergency**.)

| # | Login | Do | Pass if |
| --- | --- | --- | --- |
| B1 | `karim@yopmail.com` | Submit message above | UUID detail page |
| B2 | `noor@yopmail.com` | `/staff` → open under **Urgent** (not Emergency) | AI category **Electrical** |
| B3 | Noor | **Acknowledge now** → **Confirm AI** | Urgency **Urgent** confirmed; sidebar read-only |
| B4 | Noor | **Assign** → **Uttara Electric** | Assigned |
| B5 | Noor or `amin@yopmail.com` | **Mark done** + **850** ৳ | Awaiting verification; **৳850** visible |
| B6 | Karim | **Verify work** | Verified closed |
| B7 | Rina | `/committee` | Uttara Electric spend includes **850** ৳ |
| B8 | Noor | Nav | **Desk**, **Registration**, **Board**, **Alerts**, **Account** (operator superset) |

---

## Flow C — Emergency (visual + triage)

**Message (Karim):** `Water leaking into the lift shaft from 10-A bathroom. Floor is wet. This is not a drip — it is running.`

| # | Login | Do | Pass if |
| --- | --- | --- | --- |
| C1 | Karim | Submit | Request created |
| C2 | Hasan or Noor | Board | **Terracotta** emergency styling; AI **Emergency** / Water |
| C3 | Staff | Acknowledge → Confirm AI → Assign (Rahman Pump or Metro Lift) | Full triage works |
| C4 | — | Complete through verify | Closes normally |

---

## Flow D — Role boundaries

| # | Login | Do | Pass if |
| --- | --- | --- | --- |
| D1 | `rina@yopmail.com` | Open `/staff` directly | Redirected — no Board |
| D2 | Karim | Open `/staff` | Redirected or no access |
| D3 | Rafiq | `/vendor` | Only **assigned** jobs |
| D4 | Any desk role | Header | Name + role shown; **Sign out** works |

---

## Flow E — AI panel edge cases

| # | Login | Do | Pass if |
| --- | --- | --- | --- |
| E1 | Hasan | Open **acknowledged** request, confirm AI once | Button disappears; shows “Staff confirmed” + timestamp |
| E2 | Hasan | Try override before confirm | Override AI requires reason; then read-only |
| E3 | Noor | Open **verified closed** request | AI panel read-only; **Confirm AI** not shown; no duplicate timeline entries |

---

## Flow F — Registration & profile

| # | Login | Do | Pass if |
| --- | --- | --- | --- |
| F5 | Rina or Noor | `/committee/registry` | Edit building facts; invite person |
| F6 | Any role | `/account` | Edit name; header updates |

---

## Global pass criteria

- [ ] Resident cannot close a request without **Verify work**
- [ ] Cost persists after **Mark done** (not ৳0 when a number was entered)
- [ ] Committee sees spend; staff/admin see money on board cards
- [ ] Wrong IAM role → “No desk” or redirect (not a blank crash)
- [ ] Emergency requests visually distinct (terracotta) on staff board

---

## Quick reference — who does what

```
Karim submit
    → Staff/Admin: Acknowledge
    → Staff/Admin: Confirm AI (once)
    → Staff/Admin: Assign vendor
    → Vendor/Staff: Mark done + cost
    → Karim: Verify work
    → Rina: Desk (spend)
```

**Production URL:** https://dbsblo.slsblx.com  
**Tenant:** `D975c4874bd6b47b995cce54f926c09cc`
