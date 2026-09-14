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

## Full request flow (reference)

Two valid paths after Karim submits. **Confirm AI is recommended but not enforced** — staff can assign without it.

### What happens on submit (automatic)

| Item | Behaviour |
| --- | --- |
| **Path** | Karim → `/resident/new` → message → **Submit** |
| **AI** | `proposeFromMessage` sets **category**, **urgency**, **reason**, **draft reply** |
| **Queue** | Category + urgency are **already on the request** (board grouping works immediately) |
| **Status** | **Submitted** |
| **Timeline** | `Request submitted` |
| **Alerts** | Staff/admin get a notice |

**Example:** `bathroom light flickering, urgent — cannot see at night`  
→ **Electrical**, **Urgent** (word “urgent” alone does **not** become Emergency).  
**Avoid** “leak” / “shaft” in demo messages unless testing emergency — those force **Emergency**.

### Path 1 — With Confirm AI (recommended demo)

```
Karim submit
  → Admin/Staff: Acknowledge
  → Admin/Staff: Confirm AI (or Override AI)   ← human sign-off
  → Assign vendor
  → Mark done + cost
  → Karim: Verify work
  → Rina: Desk (spend)
```

| Step | Who | Action | Status after | Timeline |
| --- | --- | --- | --- | --- |
| 1 | Karim | Submit | Submitted | Request submitted |
| 2 | Hasan / Noor | **Acknowledge now** | Acknowledged | Acknowledged |
| 3 | Hasan / Noor | **Confirm AI** or **Override AI** | Acknowledged | AI suggestion confirmed / AI urgency overridden |
| 4 | Hasan / Noor | **Assign** vendor | Assigned | Assigned to vendor |
| 5 | Vendor / staff | **Mark done** + cost | Awaiting verification | Work marked done — waiting for resident verify |
| 6 | Karim | **Verify work** | Verified closed | Resident verified — closed |
| 7 | Rina | `/committee` | — | Spend rollup updates |

**After Confirm AI:** sidebar → **“AI suggestion — on record”** (read-only); **Confirm AI** button hidden.

### Path 2 — Without Confirm AI (skip staff approval)

Staff **can** move the job forward without clicking Confirm AI. The app does **not** block Assign or Mark done.

```
Karim submit
  → Admin/Staff: Acknowledge
  → Admin/Staff: Assign vendor          ← skip Confirm AI
  → Mark done + cost
  → Karim: Verify work
  → Rina: Desk (spend)
```

| Step | Who | Action | Pass if |
| --- | --- | --- | --- |
| 1 | Karim | Submit | UUID detail; AI category/urgency visible on board |
| 2 | Noor / Hasan | **Acknowledge now** | Acknowledged |
| 3 | Noor / Hasan | **Do not** click Confirm AI — go straight to **Assign** | Assign succeeds; status **Assigned** |
| 4 | Noor / Hasan | Sidebar still shows **“AI suggestion — staff must confirm”** + **Confirm AI** button | Panel stays interactive while request is open |
| 5 | Noor / Hasan | **Mark done** + cost | Awaiting verification; cost persists |
| 6 | Karim | **Verify work** | **Verified closed** |
| 7 | Noor / Hasan | Re-open closed request on Board | Sidebar **read-only**; **no** “Staff confirmed” line; message **“Request is closed — triage actions are read-only.”** |
| 8 | Noor / Hasan | Timeline | **No** `AI suggestion confirmed` entry (only acknowledge → assign → done → verify) |
| 9 | Rina | `/committee` | Spend still includes cost — closure does not depend on Confirm AI |

**Differences vs Path 1**

| | With Confirm AI | Without Confirm AI |
| --- | --- | --- |
| Assign / Mark done / Verify | Works | Works |
| Board urgency column | Uses AI (or override) urgency from submit | Same — AI urgency already on request |
| Timeline audit | Includes staff AI sign-off | No AI confirm line |
| `staffReply` stored | Yes (from AI draft on confirm) | Not set until someone confirms |
| Sidebar while open | Read-only after confirm | **Confirm AI** still offered |
| Sidebar after close | Read-only + “Staff confirmed · …” | Read-only + **no** staff confirm timestamp |

Use **Flow G** below for a full manual pass of Path 2.

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
| E3 | Noor | Open **verified closed** request (confirmed path) | AI panel read-only; **Confirm AI** not shown; no duplicate timeline entries |
| E4 | Noor | Open **verified closed** request (skipped confirm) | Read-only; **no** “Staff confirmed” line; closed message only |

---

## Flow G — Skip Confirm AI (Karim → close without staff AI approval)

**Message (Karim):** `QA skip AI — kitchen sink slow drain, not urgent`  
(Use a **new** message each run so you can find the ticket on the board.)

| # | Login | Do | Pass if |
| --- | --- | --- | --- |
| G1 | `karim@yopmail.com` | `/resident/new` → message → **Submit** | UUID detail page |
| G2 | `noor@yopmail.com` | `/staff` → open new request | **Routine** or **Urgent** from AI; **Confirm AI** **not** clicked yet |
| G3 | Noor | **Acknowledge now** only | Acknowledged; sidebar still **“staff must confirm”** |
| G4 | Noor | **Assign** → Rahman Pump Service (**skip** Confirm AI) | Assigned; vendor alert; timeline has **no** AI confirm line |
| G5 | Noor | **Mark done** + **400** ৳ | Awaiting verification; **৳400** shows |
| G6 | Karim | `/inbox` → **Verify work** | Verified closed |
| G7 | Noor | Re-open same request on Board | **Confirm AI** hidden (closed); **no** “Staff confirmed”; spend unchanged |
| G8 | `rina@yopmail.com` | `/committee` | **400** ৳ in spend; no Board nav |

**Optional — confirm late (while still open):** At G4, before Assign, open another request and note you can still **Confirm AI** on the acknowledged ticket until it closes. After G6, Confirm AI is no longer available.

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
- [ ] **Path 1:** Confirm AI once → sidebar read-only; timeline has AI confirm
- [ ] **Path 2:** Skip Confirm AI → job still closes; timeline has **no** AI confirm; closed ticket AI panel read-only

---

## Quick reference — who does what

**Recommended (with AI sign-off):**

```
Karim submit
    → Staff/Admin: Acknowledge
    → Staff/Admin: Confirm AI (once)
    → Staff/Admin: Assign vendor
    → Vendor/Staff: Mark done + cost
    → Karim: Verify work
    → Rina: Desk (spend)
```

**Alternate (skip AI approval — still closes):**

```
Karim submit
    → Staff/Admin: Acknowledge
    → Staff/Admin: Assign vendor        (Confirm AI optional / skipped)
    → Mark done + cost
    → Karim: Verify work
    → Rina: Desk (spend)
```

**Production URL:** https://dbsblo.slsblx.com  
**Tenant:** `D975c4874bd6b47b995cce54f926c09cc`
