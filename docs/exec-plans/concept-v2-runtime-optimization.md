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

## Stop-lines

- Stop the dependent group if preserving behavior would require changing visible geometry/effects, the Experience gate, Lenis ownership/configuration, canonical assets/content, dependencies, Figma or production state.
- Complete a group only with fresh evidence for its final runtime SHA. Keep the remaining groups active until every P-ID has direct proof.
