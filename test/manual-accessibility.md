# Windows accessibility verification

Status: Automated release-candidate verification complete. Direct Narrator
speech output remains a documented manual limitation.

The repeatable Windows checks run in installed Microsoft Edge through
`test/e2e/windows-edge.spec.mjs`. They use a 640 CSS-pixel viewport to model the
available width at 200% browser zoom on a 1280-pixel-wide window, Edge forced
colors, keyboard input, and Edge's full accessibility tree.

## Keyboard

- [x] Skip links become visible and move focus to the main content.
- [x] Navigation follows a logical order on all three example sites.
- [x] Every interactive element has a visible focus indicator.
- [x] The profile disclosure opens and closes with Enter and Space.
- [x] Registration errors move focus to the first invalid field.
- [x] Successful registration moves focus to the local status message.

## Zoom and reflow

- [x] The 200% zoom equivalent width has no document-level horizontal
      scrolling.
- [x] Text does not overlap or become clipped.
- [x] The team table exposes a labeled, keyboard-focusable horizontal region
      when needed.

## Windows forced colors

- [x] Links, buttons, fields, navigation state, and focus remain
      distinguishable.
- [x] CSS-only decorative graphics do not hide essential information.
- [x] Form errors are understandable without relying on color alone.

## Narrator-facing semantics

- [x] Edge exposes the page title and primary heading in its accessibility
      tree.
- [x] Edge exposes banner, navigation, main, and content-info landmarks.
- [x] Edge exposes the table caption plus four column and five row headers.
- [x] Edge exposes registration labels, descriptions, invalid state, checkbox
      state, errors, and final status text.

These checks verify the browser accessibility tree consumed by assistive
technology. Codex's Windows UI safety guard could not establish the active Edge
URL, so it stopped both attempts to automate Narrator. The checklist therefore
does not claim that spoken wording or voice output was heard.

## Edge smoke test

- [x] All 10 pages load without console errors.
- [x] Existing HTTP and direct-file compatibility URLs still open.
- [x] Light and dark system themes render with distinct palettes.
- [x] Registration makes no network request and leaves no browser storage.

## Verification record

| Field      | Value                                                               |
| ---------- | ------------------------------------------------------------------- |
| Date       | 2026-07-31                                                          |
| Windows    | Build 26200.8875, display version 25H2                              |
| Edge       | 150.0.4078.105                                                      |
| Narrator   | Executable 10.0.26100.8875; direct speech output not automated      |
| Result     | Repeatable Edge accessibility gates passed; speech check documented |
| Evidence   | `test/e2e/windows-edge.spec.mjs`: 26/26 passed                      |
| Limitation | Computer Use stopped because it could not verify the active URL     |
