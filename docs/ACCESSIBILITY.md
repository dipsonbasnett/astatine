# Accessibility

**Status:** WCAG 2.2 AA target; automated checks passing; no independent audit or manual
screen-reader review yet · **Last reviewed:** 2026-11-16

Astatine treats accessibility as a product boundary. A crew-facing interface that cannot be
operated by keyboard, read at 390 CSS px, or understood without color is not a usable foundation.
This document records what is implemented, what is tested, and what remains unverified.

Astatine does not claim WCAG conformance or certification. Automated checks cover only a subset of
success criteria, and a passing suite is not a substitute for assistive-technology testing.

## 1. Conformance target

- **Target:** WCAG 2.2 Level AA for the implemented surfaces.
- **Scope:** the ten intended routes, the not-found state, navigation, settings, readiness, the
  mission health brief, privacy dialog, and error boundary.
- **Not in scope yet:** feature flows that do not exist, real-time updates, user accounts, and
  clinical content.
- **Browsers:** current evergreen Chromium is automated. Other browsers are not yet in the test
  matrix, though the implementation uses standard platform behavior.

## 2. Implemented patterns

### Structure and semantics

- One `<h1>` per page; section headings form a logical hierarchy.
- Header, labelled navigation, main, and footer landmarks. Desktop and mobile navigation are
  separated by breakpoint so only the relevant one is exposed.
- Lists are used for link groups and card collections.
- Icons are decorative (`aria-hidden`, `focusable="false"`) unless a control needs a name.
- Status ("Planned", "Soon", "Available") is written as text, not conveyed by color alone.
- Data classes and product boundaries are written in prose, not only in badges.
- Readiness factor scores use native `<meter>` elements with accessible names and visible numeric
  labels. The simulated trend exposes each value as text in a labelled list, so bar height is not
  the only carrier of meaning.
- The readiness window toggle is a labelled button group with `aria-pressed`; band changes are
  announced through a polite status region.

### Keyboard and focus

- A skip link is the first focusable control and targets the focusable main region.
- All interactive elements are native buttons, links, inputs, and selects.
- Focus is always visible: a 2 px accent outline with a 3 px offset, measured at 13.32:1 against
  the canvas.
- Route changes move focus to `<main>` and reset scroll, while initial load does not steal focus.
- The mobile navigation is a disclosure: the trigger exposes `aria-expanded` and `aria-controls`,
  Escape closes it and restores focus, and choosing a destination closes it.
- The desktop sidebar navigation uses `aria-current="page"`, an accent indicator bar, and medium
  weight in addition to background color.
- Native `<dialog>` provides focus containment and background inertness; Escape and the close
  button share one close path and return focus to the trigger.

### Names and labels

- Every field has a visible, programmatically associated label.
- Hints and errors are connected with `aria-describedby`; invalid fields set `aria-invalid`.
- Every icon-only control has an accessible name.
- The brand link derives its accessible name from its visible text plus a visually hidden
  "go to overview" suffix, avoiding a name that does not contain the visible label.
- Dialog headings name their dialogs through `aria-labelledby`.

### Screen-reader feedback

- Document titles update per route.
- A polite, visually hidden live region announces the new page label after navigation.
- The lazy-route fallback exposes a concise status message.
- Error states use `role="alert"` where appropriate.
- No essential information is conveyed only by animation, color, position, or an icon.

### Motion

- `prefers-reduced-motion: reduce` removes transitions and animation durations in base CSS.
- The in-app motion preference sets `data-motion="reduced"` and applies the same reduction.
- There is no autoplay, parallax, video, or decorative motion.

### Reflow and touch

- The layout is mobile-first, with a collapsible navigation below the desktop breakpoint.
- Every route is checked for horizontal overflow at 390 × 844 CSS px in Playwright.
- Navigation rows, inputs, selects, and medium buttons use a minimum height of 44 px. Small
  buttons remain at least 36 px high, above the WCAG 2.2 AA 24 px minimum.
- Text uses responsive sizing and does not require two-dimensional scrolling at the tested width.

### Forms and errors

- The only free-text field is the optional callsign, with a visible label and a 32-character limit.
- Errors are text messages, not color-only borders.
- Reset is confirmed in a named dialog; cancel and confirm are distinct actions.
- The error boundary offers a reload and a link home, and states that no data was uploaded.

## 3. Color and contrast

Ratios below were computed from the token hex values using WCAG 2.x relative luminance. Text is not
rendered with reduced opacity except when a control is disabled, which is exempt.

| Pair                        | Ratio   | Use                                       |
| --------------------------- | ------- | ----------------------------------------- |
| `ink` on `canvas`           | 17.64:1 | Primary text                              |
| `ink-muted` on `surface`    | 10.70:1 | Secondary text                            |
| `ink-subtle` on `surface`   | 7.38:1  | Supporting text, captions, placeholders   |
| `ink-subtle` on `canvas`    | 7.69:1  | Placeholders in fields                    |
| `accent` on `surface`       | 12.79:1 | Accent text and active icons              |
| `accent` on `canvas`        | 13.32:1 | Focus outline and accent marks            |
| `accent-ink` on `accent`    | 11.56:1 | Primary button label                      |
| `danger` on `surface`       | 10.00:1 | Error text                                |
| `line-control` on `canvas`  | 3.37:1  | Input, select, and interactive boundaries |
| `line-control` on `surface` | 3.24:1  | Secondary button and card boundaries      |
| `line-control` on `raised`  | 3.02:1  | Interactive boundaries on raised panels   |

`line` remains a low-contrast decorative divider for non-interactive structure. Interactive
controls use `line-control` and do not rely on the decorative token. Active navigation adds a
2 px accent bar and medium weight, so the state is not background-color-only.

A manual token audit found the original interactive borders at 1.4–2.1:1. The `line-control` token
was added for controls; the browser axe suite does not test non-text contrast, so this was a manual
finding rather than an automated pass.

## 4. Automated evidence

### Unit suite

`npm test` runs 170 tests in 32 files covering primitives, labels and descriptions, modal behavior,
the privacy dialog, preferences and storage, the settings reset flow, the error boundary, routes,
skip navigation, route focus/reset, readiness and countermeasure engines, dataset provenance
validation, the research integrity page, the simulated mission monitor, the mission health brief,
and the check-in → readiness → coach and report flows.

### Browser suite

`npm run test:e2e` builds the production app and runs Playwright in two projects: desktop
(1280 × 900) and mobile (390 × 844, touch, DPR 2). At the last review, 37 checks passed and one was
intentionally skipped in the desktop project (the mobile navigation case).

Coverage:

- all ten routes and the not-found state: one visible level-one heading, correct document title,
  visible main region, and no horizontal overflow;
- axe scans on all routes and the not-found state in both projects, with tags for WCAG 2.0, 2.1,
  and 2.2 A/AA rules and an expectation of zero violations;
- skip link as the first tab stop;
- route-change focus and scroll reset;
- mobile disclosure, Escape, focus return, and navigation close;
- data-policy dialog naming, content, Escape close, and focus return;
- preference persistence across reload and clean reset;
- a recorded check-in producing readiness factors, a simulated trend labeled "Not used in
  readiness," a countermeasure coach, and the 14-day window toggle;
- no third-party network requests.

All checks run in CI. Failure artifacts and the Playwright report are uploaded when the browser job
fails.

### Audit notes

The axe run caught a `label-content-name-mismatch` on the brand link. The link had an `aria-label`
that did not contain its visible "ASTATINE / Mission health" text. It now derives its name from the
visible content plus a hidden suffix. This is an example of why the browser scan remains in the
gate.

## 5. Manual testing still required

The following have not been completed and must not be implied by the automated suite:

- a screen-reader pass with at least one desktop and one mobile assistive technology;
- keyboard-only testing in browsers other than Chromium;
- 200% text zoom and 400% reflow checks beyond the 390 CSS px viewport;
- forced-colors / high-contrast mode;
- switch-control and voice-control operation;
- cognitive walkthrough with representative mission-support users;
- real crew usability testing in a simulated mission context;
- review of all error and edge states by an accessibility specialist.

## 6. Known limitations

- Dark theme only; there is no light or high-contrast theme.
- No localization or right-to-left layout support.
- The test matrix uses Chromium only.
- Native `<dialog>` implementation varies slightly across browsers; older browsers are not
  supported.
- Automated axe scans catch only a subset of WCAG issues, and non-text contrast is not covered.
- The settings surface does not visually warn when browser storage is unavailable; the app remains
  functional but the preference may not persist.
- Planned pages contain limited interaction, so their future flows have not been assessed.
- No independent accessibility audit has been performed.
- The interface uses very small uppercase metadata in a few places; labels were raised to 11 px,
  but further readability testing is warranted.

## 7. Contributor checklist

For any interface change:

- [ ] Use native semantic elements before ARIA.
- [ ] Keep one level-one heading and a logical heading order.
- [ ] Verify keyboard order, visible focus, and Escape behavior for overlays.
- [ ] Give every control a visible label or an accessible name.
- [ ] Do not rely on color alone for state or meaning.
- [ ] Use `line-control` for interactive boundaries and verify at least 3:1.
- [ ] Keep text at least 4.5:1; large text at least 3:1.
- [ ] Confirm 390 CSS px reflow and no horizontal scrolling.
- [ ] Confirm reduced-motion behavior.
- [ ] Add or update unit and browser tests.
- [ ] Run `npm test`, `npm run test:e2e`, and `npm run lint`.
- [ ] Update this document when evidence or limitations change.

## 8. Reporting an accessibility issue

Open a repository issue describing the page, browser, assistive technology, steps, expected
behavior, and actual behavior. Do not include personal health information. If the report is
security-sensitive, omit exploit details and use a private channel if one is available.

## 9. Related documents

- [PRODUCT.md](PRODUCT.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DATA_POLICY.md](DATA_POLICY.md)
- [RELEASE.md](RELEASE.md)
