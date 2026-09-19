# Concept V2 runtime optimization

Status: `IN_PROGRESS`

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

## Stop-lines

- Stop the dependent group if preserving behavior would require changing visible geometry/effects, the Experience gate, Lenis ownership/configuration, canonical assets/content, dependencies, Figma or production state.
- Complete a group only with fresh evidence for its final runtime SHA. Keep the remaining groups active until every P-ID has direct proof.
