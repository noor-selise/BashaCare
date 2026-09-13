# BashaCare

Apartment maintenance desk for Uttara Heights. Next.js App Router. Product spec in `BRD.md`. Visual system in `DESIGN.md`.

```
npm install
npm run check:seed
npm run dev
```

Open `http://localhost:3000` and enter as Nusrat (7-B), Hasan (staff), or Rina (committee).

Blocks project is BashaCare (`D975c4874bd6b47b995cce54f926c09cc`). Fill `.env.local` from `blocks projects get` and `blocks auth oidc-clients list` only. Hosted login needs HTTPS on `dbsblo.slsblx.com`; `http://localhost` will not keep the session cookie.

```
blocks init
```

## Folder structure

```
BashaCare/
  BRD.md DESIGN.md README.md     product + visual source of truth
  .design/basha-care/            brief, IA, tokens, spec, tasks
  blocks/                        Blocks CLI workspace
  src/
    app/                         routes — one folder per role URL
    components/
      layout/                    shell, header, emergency banner
      requests/                  card, composer, evidence, status rail
      triage/                    staff AI panel
      committee/                 treasurer desk
      ui/                        button, empty state
    features/
      requests/                  board grouping, status order
      spend/                     vendor cost rollups
      ai/                        category / urgency proposal
    data/                        seeded building, seed check
    lib/
      blocks/                    single Blocks client
      session/                   role home
      store.tsx                  demo session + request lifecycle
      format.ts money.ts cn.ts
    types/                       domain types
```

Routes stay in `src/app/<role>/`. Domain math stays in `src/features/`. Pages stay thin.
