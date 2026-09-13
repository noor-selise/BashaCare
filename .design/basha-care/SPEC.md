# Spec: BashaCare

## Objective

Build a beautiful Next.js operations app for one Uttara apartment building so residents can report problems, staff can triage (with AI as a suggestion), emergencies look different from routine work, residents verify close, and the committee can answer — on one screen — which vendor is slow, what they cost, and which urgent incidents are open.

Success is the scripted demo in `BRD.md` FR-7 running without a live Blocks tenant.

## Tech Stack

- Next.js App Router, TypeScript, Tailwind CSS
- React 19, no semicolon style
- `@seliseblocks/client` ready for a future tenant
- Blocks workspace via `blocks init` (local schemas)
- Local seeded store (React context) for the demo
- No new state library

## Commands

```
Dev: npm run dev
Build: npm run build
Lint: npm run lint
Typecheck: npx tsc --noEmit
```

## Project Structure

```
src/app/                 routes (IA URLs)
src/components/          layout, request, triage, committee, ui
src/features/            request board, spend rollups, AI propose
src/data/                demo seed
src/lib/                 store, session, money, Blocks client
src/types/               domain types
blocks/                  Blocks schemas/rules from CLI
.design/basha-care/      brief + IA
DESIGN.md                visual system
BRD.md                   requirements
```

## Code Style

```tsx
const handleVerify = () => {
  closeRequest(request.id)
}

<button
  type="button"
  className="min-h-11 rounded-lg bg-courtyard px-4 text-surface"
  onClick={handleVerify}
>
  Verify work
</button>
```

- Early returns
- `handle` prefix on events
- Tailwind only
- Tokens from CSS variables, not raw hex in JSX
- Descriptive names

## Testing Strategy

- Seed integrity check: pump total is ৳38,500 across six jobs
- Lifecycle check: cannot close without resident verify
- Access check: resident store filters by flat
- Manual browser pass of the three demo paths
- `npm run build` must pass

## Boundaries

- Always: role isolation in the store, tokens not hex in components, no secrets in git
- Ask first: creating a live Blocks project, adding SMS, adding payments
- Never: raw fetch to Blocks APIs, invent tenant keys, push to remote

## Architecture

- Demo session holds `{ role, actorId, flatId }`
- `BuildingProvider` hydrates seed + actions
- AI is a pure function over message + vendor history
- Photos are object URLs or seeded remote placeholders
- Blocks schemas document the intended cloud model; the UI reads the local store

## Approaches considered

1. **Next.js + local store + Blocks init** (chosen) — matches the Next.js ask, runs without a dead tenant, still uses the CLI.
2. `blocks new web` Vite scaffold — official path, but not Next.js.
3. Live Blocks Data from day one — blocked: leftover tenant was rejected (`Target tenant does not exist`).

## Success Criteria

- [ ] Design tokens match `DESIGN.md`
- [ ] Four roles can enter and only see their data
- [ ] 7-B routine path and 10-A emergency path both work
- [ ] Staff can override AI urgency
- [ ] Committee desk shows pump ৳38,500 + replace decision
- [ ] Bengali message renders
- [ ] Mobile 375px usable

## Open Questions

- User must `blocks login` before a real tenant can be created. Demo does not block on that.
