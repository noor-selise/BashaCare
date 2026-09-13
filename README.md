# BashaCare

Apartment maintenance desk for Uttara Heights. Next.js App Router. Product spec in `BRD.md`. Visual system in `DESIGN.md`.

```
npm install
npm run check:seed
npm run cert
npm run dev
```

Open `https://dbsblo.slsblx.com` — not localhost. `npm run dev` starts Next on `127.0.0.1:3000` and the HTTPS proxy on 443. First sudo on a machine grants this Node binary `cap_net_bind_service` so later runs do not ask again. First time on a machine: add `127.0.0.1 dbsblo.slsblx.com` to `/etc/hosts`, then `npm run cert`.

Blocks project is BashaCare (`D975c4874bd6b47b995cce54f926c09cc`). Fill `.env.local` from `blocks projects get` and `blocks auth oidc-clients list` only. The public OIDC callback is `https://dbsblo.slsblx.com/login/callback`.

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
