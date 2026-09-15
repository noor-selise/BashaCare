# Ledger & Ink — BashaCare Design System v2

**Status:** Approved by user (visual brainstorming session), not yet implemented.
**Supersedes:** `DESIGN.md` v1.0 ("Scandinavian civic" — Fraunces/Figtree, warm-paper canvas, courtyard teal).

## Why

DESIGN.md v1's "Scandinavian civic" concept (warm cream paper, courtyard teal,
terracotta emergency, Fraunces display serif over Figtree sans) was written to
avoid generic SaaS design, but in practice it landed on the exact recipe that
AI page-builders (v0, Lovable, and similar generators) now default to for
"warm, tasteful, non-corporate" products: cream/off-white canvas + a trendy
serif (Fraunces is a very common pick) + a muted teal/terracotta pair. The
result reads as generic despite the intent, because the concept was built
from a mood (warmth + restraint) rather than from anything specific to this
product.

Ledger & Ink replaces the mood-board approach with a concept grounded in a
real artifact: the maintenance/complaint register a building's committee
would actually keep — ruled ledger lines, sequential entry numbers, ink
stamps for status. This was chosen over two other concrete directions
(a literal cork/bulletin pin-board, and a bilingual Dhaka-civic/government
notice aesthetic) after a visual side-by-side comparison.

## Philosophy

**Concept:** BashaCare-as-logbook. Every request is an *entry* in the
building's maintenance register, not a card in a SaaS dashboard.
**Tone:** Unchanged — calm, accountable, slightly formal.
**Anti-aesthetic (updated):** Purple SaaS, Inter-on-white property
dashboards, hospital teal, dark-mode-first developer tools — **plus**:
warm-cream-paper + teal/terracotta + trendy-serif as a generic "AI-tasteful"
recipe. Soft drop-shadow cards with 12px+ radius as the default surface.

## Colors

Same token architecture as v1 (semantic tokens, not raw hex in components) —
only the values change.

### Light (default)

| Token | Hex | Use |
| ----- | --- | --- |
| canvas | `#EDE6D3` | Page background — ledger paper |
| canvas-warm | `#E3D9BF` | Alternating bands, wells |
| surface | `#F5EFDF` | Cards, sheets |
| surface-2 | `#EFE7D0` | Inset panels, composer |
| ink | `#1A1A1A` | Primary text |
| ink-soft | `#5B5348` | Secondary text |
| ink-faint | `#8A8376` | Meta, timestamps (unchanged from v1) |
| hairline | `#D3C9AE` | Borders, rules |
| register (was courtyard) | `#1A1A1A` | Primary action — the register's own ink, not a color |
| register-hover | `#000000` | Hover / pressed |
| register-soft | `#E3D9BF` | Chips, selected rows |
| emergency (was terracotta) | `#A6321D` | Emergency only |
| emergency-deep | `#6E2012` | Emergency text on wash |
| emergency-wash | `#F0DACB` | Emergency banner, pinned rows |
| urgent (was clay) | `#8A6A1E` | Urgent (not emergency), on `#F0DEB8` wash |
| verified (was garden) | `#2E5339` | Success, verified stamp |
| verified-wash | `#DCE6DC` | Verified chips |
| caution (was warning) | `#8A6A1E` | AI caution, replace flag (shares urgent hue — both are "attention, not danger") |
| caution-wash | `#F0DEB8` | Replace recommendation |
| seal-gold | `#C9A227` | New: entry-number accent, mono IDs, optional stamp ring |

### Dark

Warm charcoal-brown, not cool slate — same principle as v1, new values.

| Token | Hex |
| ----- | --- |
| canvas | `#1B1712` |
| canvas-warm | `#221D16` |
| surface | `#241F17` |
| surface-2 | `#2B241A` |
| ink | `#EFE7D6` |
| ink-soft | `#C9C0AB` |
| ink-faint | `#9A9184` |
| hairline | `#4A4232` |
| register | `#EFE7D6` |
| register-hover | `#FFFFFF` |
| register-soft | `#3A3324` |
| emergency | `#E2735A` |
| emergency-deep | `#F4C4A8` |
| emergency-wash | `#3A2418` |
| urgent | `#C9A227` |
| verified | `#7FB88F` |
| verified-wash | `#1E3326` |
| caution | `#C9A227` |
| caution-wash | `#3A3118` |
| seal-gold | `#C9A227` |

Support both `prefers-color-scheme` and `[data-theme="dark"|"light"]`, same as v1.

## Typography

Do not use Inter, Roboto, Arial, or system UI — **and retire Fraunces/Figtree**
(the old pairing; keep them out of new work entirely, don't mix old and new).

| Role | Family | Fallback | Notes |
| ---- | ------ | -------- | ----- |
| Display / register head | **Spectral** | Georgia, serif | Building name, page titles, section heads. Weight 600–700. Ruled double-line underline on titles/headers (`border-bottom: 3px double`). |
| UI / body | **Public Sans** | "Source Sans 3", sans-serif | Navigation, buttons, tables, body copy. Weight 400–700. |
| Resident voice | **Noto Sans Bengali** | "Nirmala UI", sans-serif | Unchanged from v1. Bangla messages must not tofu. |
| Mono / IDs | **IBM Plex Mono** | ui-monospace | Unchanged from v1. Now also used for the entry-number convention (`ENTRY №0142`) that replaces plain "2h ago" as the primary meta pattern — pair with a relative-time string, don't replace it. |

### Type ramp

Same sizes/line-heights as v1 (they weren't part of the complaint), family
swapped:

| Token | Size | Line | Weight | Family |
| ----- | ---- | ---- | ------ | ------ |
| display | clamp(40px, 6vw, 72px) | 1.05 | 650 | Spectral |
| title | 32px / 28px mobile | 1.15 | 650 | Spectral |
| heading | 22px | 1.25 | 650 | Spectral |
| subhead | 18px | 1.35 | 600 | Public Sans |
| body | 16px | 1.55 | 400 | Public Sans |
| message | 16px | 1.7 | 400 | Noto Sans Bengali + Public Sans |
| meta | 13px | 1.4 | 500 | IBM Plex Mono, letter-spacing 0.02em (was Figtree — meta is now mono to read as ledger metadata) |
| label | 11px | 1.2 | 700 | IBM Plex Mono, uppercase, 0.06em |

Body is never smaller than 16px on mobile (unchanged).

## Layout & motifs

- Base unit 4px, rhythm 8px, spacing scale, page widths, content measure,
  breakpoints: **unchanged from v1** — not part of the complaint.
- **Radius tightens**: cards/panels 4–6px (was 12px). Buttons 4px (was 8px).
  Pills/stamps keep a small radius (3px), not fully rounded — stamps read as
  stamped rectangles, not chips.
- **Elevation drops further than v1**: hairlines are the primary separator
  everywhere. Shadow (`--shadow-sheet`) reserved only for truly floating
  surfaces — modals, toasts, dropdowns — never for request/board cards.
- **Ruled double-line rule**: section headers and the top of primary cards
  get a `border-bottom: 3px double` in `ink` (light) / `ink` (dark) —
  the ledger's signature mark. Use once per section, not on every sub-element.
- **Ink-stamp badges** replace v1's soft pill chips for status (emergency /
  urgent / verified / queued): bordered rectangle, uppercase IBM Plex Mono,
  slight rotation (-2° to -3°) for emergency/urgent stamps only — verified
  and queued stay unrotated (a stamp of approval sits straight; an urgent
  flag looks hastily stamped).
- **Entry-number meta convention**: every request/log row shows
  `ENTRY №xxxx` in IBM Plex Mono ahead of or alongside the relative
  timestamp, mirroring a physical register's sequential numbering.
- Emergency banner: **unchanged rule** — full-bleed, 0 radius, no shadow —
  but now set in Spectral (label) + Public Sans (meta), on `emergency-wash`.
- Staff board / committee desk column layout: **unchanged from v1**
  (emergency pin, then urgent/routine stacks; three-column committee desk
  at 1024px+). Rows within those stacks adopt the ledger-row treatment
  (hairline-separated, no per-row card shadow) instead of a card grid.

## What does not change

Spacing scale, breakpoints/page widths, copy rules (request not ticket,
verified closed, ৳ formatting, AI-as-suggestion voice), urgency semantics
(emergency/urgent/routine and "never color alone"), motion timing (150/280/
450ms, no bounce, reduced-motion handling), icon style (1.75 stroke line
icons), photo-evidence treatment. None of these were part of the "feels
generic" problem, so they carry over as-is from v1.

## Scope of implementation (for the follow-up plan)

1. **Foundation**: rewrite `DESIGN.md` to this spec; update `layout.tsx`
   Google Fonts imports (drop Figtree/Fraunces, add Spectral + Public Sans;
   keep Noto Sans Bengali + IBM Plex Mono); update `globals.css` CSS
   variables and `@theme inline` mappings to the new token names/values.
   Because components consume semantic tokens (not raw hex/fonts), most
   surfaces re-skin automatically once this lands.
2. **Motif primitives** (new, small): a ruled-double-line header utility,
   an ink-stamp badge component (replacing/extending the current chip
   pattern used in `status-rail.tsx` and wherever status chips render),
   and the entry-number meta pattern.
3. **First-pass surfaces** (highest visual impact, do these explicitly
   rather than relying on token inheritance alone): `emergency-banner.tsx`,
   `request-card.tsx`, `status-rail.tsx`, `site-header.tsx`, the staff/
   committee board list rendering.
4. Everything else inherits new tokens/fonts/radius via existing Tailwind
   theme mapping; a later pass can revisit any component where the flatter,
   stamp-based look needs manual adjustment (e.g. anywhere a soft-shadow
   card was load-bearing for hierarchy).

Component-by-component sequencing, and whether (3) and (4) are one plan or
two, is left to the implementation plan (`writing-plans` skill), not this
spec.
