---
version: 1.0
name: BashaCare
description: "A Scandinavian-civic operations system for a 48-flat building in Uttara. Paper canvas, courtyard teal, terracotta emergency. Display serif for the building voice, humanist sans for the desk, Bengali-capable resident messages. Emergency is a path, not a badge."
---

# DESIGN.md

BashaCare is the notice board that finally works. It should feel like a well-run municipal desk inside a home — warm paper, charcoal ink, one loud color reserved for water in the lift shaft.

**Philosophy:** Scandinavian civic (warmth + restraint).  
**Tone:** Calm, accountable, slightly formal.  
**Anti-aesthetic:** Purple SaaS, Inter-on-white property dashboards, hospital teal, dark-mode-first developer tools.

## Colors

Semantic tokens only. Raw hex lives here, not in components.

### Light (default)

| Token | Hex | Use |
| ----- | --- | --- |
| canvas | `#F4EFE6` | Page background — warm paper |
| canvas-warm | `#EBE3D4` | Alternating bands, wells |
| surface | `#FFFDF8` | Cards, sheets |
| surface-2 | `#F7F1E6` | Inset panels, composer |
| ink | `#1C1915` | Primary text (not pure black) |
| ink-soft | `#5C564C` | Secondary text |
| ink-faint | `#8A8376` | Meta, timestamps |
| hairline | `#D9D0C1` | Borders, rules |
| courtyard | `#0F5C56` | Primary action, resident trust |
| courtyard-hover | `#0A4742` | Hover / pressed |
| courtyard-soft | `#D7EDEA` | Chips, selected rows |
| terracotta | `#C45C26` | Emergency only |
| terracotta-deep | `#8C3A14` | Emergency text on wash |
| terracotta-wash | `#F8E3D4` | Emergency banner, pinned rows |
| clay | `#C4A574` | Urgent (not emergency) |
| garden | `#2F6F4E` | Success, verified |
| garden-wash | `#DCEBDE` | Verified chips |
| warning | `#B8860B` | AI caution, replace flag |
| warning-wash | `#F6EBC7` | Replace recommendation |

### Dark

Warm charcoal, not cool slate. Emergency terracotta lightens for contrast.

| Token | Hex |
| ----- | --- |
| canvas | `#1A1713` |
| canvas-warm | `#221E18` |
| surface | `#26211B` |
| surface-2 | `#2F2921` |
| ink | `#F3EDE3` |
| ink-soft | `#C9C0B3` |
| ink-faint | `#9A9184` |
| hairline | `#3D362C` |
| courtyard | `#7EC8C0` |
| courtyard-hover | `#A4D9D3` |
| courtyard-soft | `#1E3D3A` |
| terracotta | `#E08956` |
| terracotta-deep | `#F4C4A8` |
| terracotta-wash | `#3A2418` |
| clay | `#E0C48A` |
| garden | `#8FCB9B` |
| garden-wash | `#1E3326` |
| warning | `#E6C56A` |
| warning-wash | `#3A3118` |

Support both `prefers-color-scheme` and `[data-theme="dark"|"light"]`.

## Typography

Do not use Inter, Roboto, Arial, or system UI as the face of the product.

| Role | Family | Fallback | Notes |
| ---- | ------ | -------- | ----- |
| Display | **Fraunces** | "Source Serif 4", Georgia | Building name, page titles. Optical size 144, weight 560–700. Tight tracking on large sizes. |
| UI / body | **Figtree** | "Source Sans 3", sans-serif | Navigation, buttons, tables. Weight 400–650. |
| Resident voice | **Noto Sans Bengali** | "Nirmala UI", sans-serif | Bangla messages must not tofu. Apply to message bodies that may contain Bengali. |
| Mono / IDs | **IBM Plex Mono** | ui-monospace | Request IDs, taka tallies in dense tables only. |

### Type ramp

| Token | Size | Line | Weight | Family |
| ----- | ---- | ---- | ------ | ------ |
| display | clamp(40px, 6vw, 72px) | 1.05 | 620 | Fraunces |
| title | 32px / 28px mobile | 1.15 | 600 | Fraunces |
| heading | 22px | 1.25 | 600 | Fraunces |
| subhead | 18px | 1.35 | 550 | Figtree |
| body | 16px | 1.55 | 400 | Figtree |
| message | 16px | 1.7 | 400 | Noto Sans Bengali + Figtree |
| meta | 13px | 1.4 | 500 | Figtree, letter-spacing 0.02em |
| label | 11px | 1.2 | 650 | Figtree, uppercase, 0.08em |

Body is never smaller than 16px on mobile.

## Layout

- Base unit 4px. Rhythm 8px.
- Page max 1200px. Committee desk may use 1280px.
- Content measure 65ch for long text.
- Cards: 12px radius. Buttons: 8px. Pills: 999px.
- Emergency banner is full-bleed, 0 radius, no drop shadow.
- Staff board: emergency pin, then two stacks (urgent / routine). Do not put emergency in the same card grid as routine.
- Committee desk: three equal columns from 1024px (open urgents / slow vendor / spend). Stack on mobile.

## Spacing

```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 24px
--space-6: 32px
--space-7: 48px
--space-8: 64px
--space-9: 96px
```

Page padding: 16px mobile, 32px desktop. Section gaps: 32–48px.

## Motion

- Duration: 150ms controls, 280ms panels, 450ms page reveals.
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)`.
- Emergency pulse: 1.8s opacity breathe. Disabled under `prefers-reduced-motion`.
- No bounce. No confetti. Status changes fade + 4px rise.

## Elevation

Light: hairline first. Shadow only on floating sheets.

- `--shadow-sheet: 0 18px 40px rgba(28, 25, 21, 0.08)`
- Dark: `--shadow-sheet: 0 18px 40px rgba(0, 0, 0, 0.45)`

## Iconography and evidence

- Line icons, 1.75 stroke, 20–24px. No filled candy icons.
- Photos are evidence, not decoration. 4:3 thumbs, caption with who/when.
- Empty states are type + one action, no spot illustration.

## Copy

- Residents file a **request**, not a ticket.
- Work is **verified closed**, not closed.
- Money is **৳12,500**, never `Tk. 12500` or `$`.
- AI speaks as a suggestion: "Staff should confirm."
- Bangla resident messages stay in Bangla. Staff replies may be bilingual.

## Urgency language

| Level | Visual | Rule |
| ----- | ------ | ---- |
| Emergency | Terracotta wash, full-bleed banner, pin | Water, lift trapped, fire, structural. One glance. |
| Urgent | Clay rule, no banner | Same-day, not life-safety. |
| Routine | Default surface | Queues. Must not look like emergency. |

Never use color alone.

## Do not

- Purple, indigo, or electric gradients
- Inter / Roboto / Arial as brand type
- Equal padding on every card
- A 3×N feature grid on the home page
- Decorative illustration of happy families
- Dark UI as the default
