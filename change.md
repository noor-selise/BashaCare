# Changelog

All changes to this project will be documented in this file.

## [Unreleased]

- Upgraded global `@seliseblocks/cli-os` from 0.3.3 to 0.5.0 (2026-09-13)
- Added BRD with functional and non-functional requirements separated (2026-09-13)
- Added information architecture and design brief under `.design/basha-care` (2026-09-13)
- Added `DESIGN.md` Scandinavian-civic visual system (2026-09-13)
- Vendored official Blocks skills via BOOTSTRAP.md into `.codex/skills` and `.claude/skills`; Cursor copy at `.cursor/skills` (2026-09-13)
- Logged into Blocks CLI; requested tenant `D975c4874bd6b47b995cce54f926c09cc` is not shared with this account (2026-09-13)
- Revalidated BRD, IA, folder structure; added design tokens and build tasks (2026-09-13)
- Built the Next.js desk from DESIGN.md: role homes, request lifecycle through verified closed, AI override, committee spend of ৳38,500 (2026-09-13)
- Persisted demo session and request state so role switches and remounts keep the same desk (2026-09-13)
- Matched card 12px and button 8px radii from DESIGN.md (2026-09-13)
- Reorganized src into app / components / features / data / lib / types so domain code is not dumped in lib (2026-09-13)
- CLI logged in as noor.mohammad@selisegroup.com and selected BashaCare tenant D975c4874bd6b47b995cce54f926c09cc (2026-09-13)
- Registered public OIDC client and identity provider for BashaCare; enabled hosted login (2026-09-13)
- Invited first end user noor.mohammad@selisegroup.com as System User without setting a password (2026-09-13)
- Pushed Request, Vendor, Decision, and Notice schemas and reloaded the data gateway (2026-09-13)
- Wired Next.js hosted login and callback from live CLI values; demo role switcher stays as the desk fallback (2026-09-13)
- Published the desk to GitHub at noor-selise/BashaCare on main and dev (2026-09-13)
- Restricted the OIDC callback to https://dbsblo.slsblx.com/login/callback and proxy local HTTPS on that host to port 3000 (2026-09-13)
- Added a Blocks Release Dockerfile so Kaniko can build the Next.js desk on port 8080 (2026-09-13)
- Deployed branch `dev` through Blocks Release (build `ba8bc32b-a794-4614-a7cf-9de452c8e83d`) to https://dbsblo.slsblx.com (2026-09-13)
- Stop npm run dev from dumping Next EADDRINUSE when port 3000 is already taken (2026-09-13)
- Make npm run dev bind https://dbsblo.slsblx.com on 443 instead of asking for a second sudo proxy (2026-09-13)
- Fix Fraunces display type (SOFT 0, opsz 144) and remove the dummy desk switcher (2026-09-13)
- Add admin, resident, staff, committee, and vendor IAM roles plus desk users; seed building records on first admin login (2026-09-13)
- Ignore html/body attribute drift from browser extensions during hydration (2026-09-13)
- Send a signed-in user to their role desk instead of the landing page; Sign out waits for IAM logout (2026-09-13)
