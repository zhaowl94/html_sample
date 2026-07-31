# Contributing

## Requirements

- Node.js 24 LTS
- npm supplied with Node.js
- Current Chrome, Edge, and Firefox on Windows for the full local matrix

Do not change Windows execution policy or environment variables for this project. In PowerShell, use `npm.cmd` when `npm.ps1` is disabled.

## Workflow

1. Create a focused branch from `master`.
2. Install exactly from the lockfile with `npm.cmd ci`.
3. Keep all existing compatibility paths available.
4. Add or update tests under `test/`.
5. Run the complete relevant test set before committing.
6. Open a pull request and wait for Windows and Ubuntu checks to pass.

## Required checks

```powershell
npm.cmd run check
npm.cmd run test:unit
npm.cmd run test:e2e:windows
npm.cmd run test:lighthouse
npm.cmd run build
```

Ubuntu CI additionally runs Chromium, Firefox, WebKit, mobile Chromium, and the committed screenshot baselines.

## Visual snapshots

Stable baselines live in `test/snapshots/`. Normal tests never overwrite them. Update them only after reviewing the visual change:

```powershell
npm.cmd run test:visual:update
```

Generated reports, failure screenshots, traces, and videos belong in `test-results/` and must not be committed.

## Content and privacy

- Use original copy and locally owned or clearly licensed assets.
- Record any third-party material in `THIRD_PARTY_NOTICES.md`.
- Do not add analytics, remote fonts, tracking pixels, form endpoints, cookies, or browser storage.
- Keep external links deliberate, HTTPS-only, and limited to authoritative references.

## HTML and accessibility

- Preserve landmark and heading order.
- Provide visible keyboard focus.
- Use native elements before ARIA.
- Give every form control a persistent label and useful error message.
- Verify layouts at 200% zoom and with Windows forced colors.
- Update `test/manual-accessibility.md` when behavior changes materially.
