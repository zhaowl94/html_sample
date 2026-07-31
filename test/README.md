# Test suite

All repository verification lives under `test/`. Runtime reports are written to `test-results/` and ignored by Git.

## Layers

| Layer       | Location                       | Purpose                                                                                                                             |
| ----------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Static      | `test/scripts/`                | Compatibility paths, internal links, fragments, path case, CSP metadata, CSS parsing, local-only runtime assets, and payload budget |
| Unit        | `test/unit/`                   | Lighthouse scoring, registration helpers, and static-checker utilities                                                              |
| Browser     | `test/e2e/`                    | Page loading, navigation, forms, storage, resource origins, keyboard behavior, Axe, direct-file access, and screenshots             |
| Manual      | `test/manual-accessibility.md` | Narrator, forced colors, keyboard, zoom, and Edge checks                                                                            |
| Performance | `scripts/run-lighthouse.mjs`   | Performance, accessibility, best-practices, and SEO scores                                                                          |

## Browser projects

- `chromium`
- `firefox`
- `webkit`
- `mobile-chromium`
- `chrome`
- `msedge`
- `visual`

Ubuntu CI owns screenshot comparison and runs the first four projects plus `visual`. Windows CI runs installed Chrome and Edge, Firefox, and mobile Chromium.

## Commands

```powershell
npm.cmd run check
npm.cmd run test:unit
npm.cmd run test:e2e:windows
npm.cmd run test:e2e:linux
npm.cmd run test:lighthouse
```

Every Lighthouse category keeps a `0.95` budget. A page is measured once when
its first sample passes. If any first score misses its budget, the runner saves
two confirmation samples and evaluates the three-run median. All raw reports
and scores remain in `test-results/lighthouse/`.

External link availability is intentionally non-blocking because remote sites and networks are unstable:

```powershell
npm.cmd run check:external-links
```

Internal links and resources are always blocking.
