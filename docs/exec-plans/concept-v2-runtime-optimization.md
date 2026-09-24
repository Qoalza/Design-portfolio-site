# Concept V2 runtime optimization

Status: `READY_FOR_REVIEW`

## Source and boundary

- Authoritative execution plan: `/Users/designer/Documents/Codex/Plans/implementation-plan-concept-v2-optimization-5955fde.md`, version 1.0, 19 September 2026.
- Baseline: `5955fde01e408a21e936e86af0805f45bc807313` on `codex/concept-v2-figma-delta-3ec86f0`.
- Scope: `tools/concept-v2/app` only. The public Next.js runtime, Admin, shared contract, canonical project data, Figma, deploy and production are out of scope.
- Mode: `LARGE` / `ELEVATED` / `FULL`.

## Required outcomes

| Group | Plan IDs | Outcome |
|---|---|---|
| G1 | P03 | Shared finite frame/activity lifecycle; Hero waits for real map activity, retains the 8 px exit safety, measures route length once and keeps current pulse behavior. |
| G2 | P04–P06 | Experience geometry invalidates after upstream layout changes; offscreen cleanup and desktop/static state transitions are correct. |
| G3 | P01, P02, P09 | Header, cursor, lens and About hover use finite coalesced work; deck reduced-motion settlement cannot be overwritten by stale animation work. |
| G4 | P07, P08 | Real responsive picture nodes own preparation, monotonic priority, fallback and decode lifecycle; Projects use the same fallback-only contract. |
| G5 | P10 | Runtime contract, evidence, review and handoff connect the reused primitives to existing consumers. |

## Locked invariants

- Preserve visual geometry, tokens, DOM layer intent, existing keyboard/touch routes and all current Hero/Experience/About interaction contracts.
- Keep one existing Lenis owner and its current configuration. Do not redesign Experience blur or masks.
- Do not generate Project image derivatives in this workstream.
- A missing Zen pass is an explicit acceptance gap, never a Chromium substitute.
- Project-card hover must not compete with scrolling: its existing visual state and keyboard focus behavior remain intact at rest, while pointer hover is removed immediately for active scroll and resumes only after settlement plus new pointer movement.

## Progress

### G0 — baseline

- Completed against the exact baseline: clean branch, `npm run check` (72 tests, lint and Vite build), `npm run check:browser` (HTTP smoke) and production preview.
- Browser baseline confirmed visible Hero pulses, cancellation after the map leaves the viewport and no further pulse after a 3.2 second wait. The first returning pulse appears without the normal 2–3 second cadence delay.

### G1 — frame/activity lifecycle and Hero

- Completed in the dedicated Git group: `frame-task` and `view-activity` have behavioral tests; RoutePulse now uses them and route geometry is split from scale-dependent timing.
- Final group checks: `npm run check` (80 tests, lint and Vite production build), `npm run check:browser` (built-runtime smoke) and `git diff --check` all passed. Review found no Lenis, wheel, visual-geometry, dependency or out-of-scope change.

### G2 — Experience geometry and state transitions

- Completed in the dedicated Git group: finite `frame-task` scheduling now owns Experience paint; exact upstream layout owners, font completion and About viewer unlock invalidate cached position without adding scroll-time geometry reads.
- Gate release above the section now precedes offscreen early return. Static mode resets internal progress/classes/paths/blur consistently; resize preservation remains desktop-to-desktop only.
- Final group checks: `npm run check` (81 tests, lint and Vite production build), `npm run check:browser` (built-runtime smoke) and `git diff --check` all passed. Review found no Lenis, gate-parameter, blur/mask, travel, dependency or protected-path change.

### G3 — pointer consumers and finite deck lifecycle

- Completed in the dedicated Git group: Header and desktop cursor coalesce frame work; Hero lens samples geometry once per pointer frame and preserves keyboard/touch/180 ms follow behavior; static base SVG is memoized while the dynamic lens stays independent.
- About hover activity is viewport-gated and uses one hit-test task per frame. A deck animation generation is cancelled and invalidated before reduced-motion settlement, so an old RAF cannot overwrite the latest target.
- Final group checks: `npm run check` (83 tests, lint and Vite production build), `npm run check:browser` (built-runtime smoke) and `git diff --check` all passed. Review found no visual-geometry, interaction-contract, Lenis, dependency or protected-path change.

### G4 — responsive media and preparation lifecycle

- Completed in the dedicated Git group: browser-selected About `picture` nodes now own AVIF/WebP/PNG loading and decode preparation; foreground and halo layers remain distinct. Viewer preparation is required/high and embedded preparation is idle/near-section promoted.
- Projects use the same fallback-only renderer but retain their existing PNG source files, wrapper layers, lazy loading and geometry. No image derivative or extra hidden `Image` loader was added.
- Final group checks: `npm run check` (86 tests, lint and Vite production build), `npm run check:browser` (built-runtime smoke) and `git diff --check` all passed. Review found no image asset, visual-layer, dependency or protected-path change.

### G5 — integration, contract and handoff

- Completed against tested runtime `3ad9b55161d10efe35f7069141793036147032a7`: the Concept V2 runtime contract documents the reusable finite-work primitives, their concrete consumers, media ownership and the boundary from the public Next.js runtime.
- Immutable evidence is stored under `design-reference/concept-v2-runtime-optimization/3ad9b55161d10efe35f7069141793036147032a7/` and names its exact runtime SHA rather than treating the following docs commit as a code build.
- Final fidelity/completeness review maps every P01–P10 to G1–G4 behavior and test coverage. Regression/scope review confirms the five D01–D05 exclusions: Lenis, Experience blur/masks, Project derivatives, Zen substitution and public-runtime integration remain outside this workstream.
- Final code evidence for the tested runtime: `npm run check` (86 tests, lint and Vite production build), `npm run check:browser` (HTTP built-runtime smoke) and `git diff --check` passed. The manual Zen feel/performance pass remains an explicit user-acceptance item.

### Follow-up — Project card hover during scrolling

- Investigation found the visible hitch near Hero/Projects occurs when the stationary pointer first enters a moving project card and starts its large hover transition; image network loading was not the trigger at that point.
- The scoped correction uses the existing Lenis stream, not another scroll loop: physical `virtual-scroll` writes a document-level gate synchronously, so pointer hover is suppressed in the same input turn; Lenis settlement restores it. Keyboard `:focus-within` behavior remains unchanged.
- The initial prepared-shadow implementation changed the approved darkening and was removed. Original image layers and `box-shadow` declarations are retained exactly; the correction has no rest/hover visual delta.
- A subsequent visual audit found the remaining missing depth came from an approximation introduced in the desktop preview shade: the CSS radial gradient replaced the exact Figma `project-shade-preview.svg` vector. The `638×328` vector is restored only in its approved Preview layer, between the rear and front artwork; card geometry, opacity states, animation and image shadows are unchanged.
- Final local verification: `npm run check` passed with 90 tests, lint and Vite production build; `npm run check:browser` passed; `git diff --check` passed. A Chromium desktop pass confirmed the original rest shadow, hover suppression during wheel input, and original hover restoration after Lenis settlement.
- Exact tested runtime: `7ea0c27` (`fix(concept-v2): restore project preview shade`).
- The remaining acceptance is an independent user feel pass in Zen. Zen automation is not evidence for this item.

### Follow-up — Zen-compatible Project media preparation

- Zen diagnostics exposed decode warnings for metadata emitted by the earlier macOS AVIF conversion: the 640 px derivatives contained `clap` and all four derivatives contained `clli`. The files were rebuilt with one-off Sharp 0.35.4 using 8-bit 4:4:4 AVIF output; no runtime dependency was added.
- The replacement assets retain the 640/1080 responsive contract and PNG fallback, are smaller at approximately 20–43 KiB, and measured 47–48 dB PSNR against equivalently resized source PNGs. The 1080 px candidate still covers the largest 519 px rendered layer above 2× density.
- Projects now reuses the existing real-node image preparer. At a 150% viewport margin it raises the four rendered image nodes to high/eager and waits for `decode()` before ordinary entry; fallback resource changes remain handled by the existing `onLoad` path.
- Exact tested runtime: `521e4eb9090b2482ba008140ea0c58b47b51f158` (`perf(concept-v2): predecode compatible project avif`). Verification: focused RED/GREEN Project tests, `npm run check` with 92 tests, lint and Vite production build, `npm run check:browser`, `git diff --check`, direct successful Zen decode without the prior AVIF parser errors, and desktop visual inspection with unchanged geometry/effects.
- Remaining acceptance: the user must compare first and repeated Hero → Projects scrolling in Zen. Headless/direct decode evidence proves asset compatibility, not subjective scroll smoothness.

### Follow-up — Hero/Projects boundary compositor stall

- The pulse and Project-media corrections reduced secondary work but did not remove the concentrated hitch at the section boundary. A fresh layer-level audit moved the investigation from card decoding to the exact render owner crossing the viewport edge.
- At the user's desktop Small Hero breakpoint, `.hero-bottom-dots` used `hero-bottom-wave-mask.svg`, whose `feGaussianBlur stdDeviation="75"` covers a `2106×714` filter region. The full-width filtered mask leaves the viewport at the same position where the hitch concentrates.
- Identical `1438×879` controlled traces measured a roughly `30 ms` maximum Graphics/SwapBuffers stage with the live SVG mask, about `2.4 ms` with the mask disabled, and about `3.6 ms` after replacing it with the pre-rasterized alpha mask.
- Runtime commit `7b12f8f7f8b6f366a3863764ed0a7e762af18e3e` changes only the mask resource to a `2880×640` 2× PNG. The dot texture remains live CSS, and its exact mask size, position, geometry and surrounding interaction owners remain unchanged.
- Pixel comparison against the old SVG-rendered field measured mean channel delta `0.063/255` and maximum delta `7/255`; visual inspection found no observable change.
- Final verification: lint and 95/95 tests passed; Vite production build and built-runtime browser smoke passed; `git diff --check` passed. Manual Zen scroll-feel acceptance remains open.

### Follow-up — Project hover settlement repaint

- After the rasterized mask removed the large stall, a smaller residual snag remained. The scroll activity flag still mutated the root `html` element, and Lenis settlement immediately restarted Project hover when the stationary pointer landed over a card during the scroll.
- Controlled tracing measured about 125 Paint events in that pass. Removing the hover selectors or holding the gate after settlement reduced the count to roughly 24–26, identifying the automatic hover restart rather than Project image decode or Header pinning as the remaining repeated paint source.
- Runtime commit `55c0da23c9a170738b45cb1dbdbc378889dfee9f` localizes `data-scroll-active` to `.projects-section`. Active scroll removes pointer hover synchronously; settlement keeps it suspended until the next pointer movement. Existing rest/hover declarations, the expanding divider line and keyboard `:focus-within` state are unchanged.
- Two post-fix traces measured 24 and 26 Paint events, zero long tasks and maximum main-thread `RunTask` durations below 5 ms. A browser interaction check confirmed the original hover state returns after one pointer movement.
- Final verification: focused RED/GREEN tests, lint and 96/96 tests, Vite production build, built-runtime browser smoke and `git diff --check` passed. Manual Zen scroll-feel acceptance remains open.

## Stop-lines

- Stop the dependent group if preserving behavior would require changing visible geometry/effects, the Experience gate, Lenis ownership/configuration, canonical assets/content, dependencies, Figma or production state.
- Complete a group only with fresh evidence for its final runtime SHA. Keep the remaining groups active until every P-ID has direct proof.
