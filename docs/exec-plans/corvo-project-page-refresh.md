# Corvo project page refresh

Status: COMPLETE  
Base: `b3b501a5a1300e49070d3f1ce1b197bc3476fe19` on `codex/redesign-portfolio`

## Outcome

Bring the full Corvo open-project page in Concept V2 into alignment with Figma
`3530:154730`, including its corrected intro background, Hero grid, lower-page
geometry, notices, metrics, and the “Один из сценариев” showcase.

## Boundaries

- Scope: Concept V2 only, under `tools/concept-v2/app`.
- Source: the supplied Figma page and its direct nodes.
- Non-scope: homepage cards, portfolio route architecture, Figma writes,
  deployment, merge into the live redesign branch, and the existing Corvo scene
  internals.
- Concurrency: this worktree is separate from the active writer on
  `codex/redesign-portfolio`.

## Slices

1. Page structure, Figma image and icon assets, notices, metrics, lower-page
   dimensions, and the scenario showcase.
2. Hero background grid with the exact Figma tile sizes, phase, and opacity.
3. Integrate the independent slices, run focused and full project checks, then
   conduct fidelity/completeness and regression/scope review.

## Acceptance

- Desktop page sections align to the measured Figma structure and colors.
- Hero keeps its existing resize and scene behavior while owning the 20 px /
  320 px, 60%-opacity grid.
- The scenario showcase uses the exact local Figma image and has the prescribed
  backdrop, clipped side panels, and copy.
- No Figma URLs remain in runtime code; every new asset is local and non-empty.
- Focused tests, lint, build, and the browser checks pass on the integrated
  state.

## Verification

- `npm test`: 162 passing tests.
- `npm run lint`: passed (65 source files checked).
- `npm run build`: passed.
- `npm run check:browser`: passed.
- Runtime review at 1440 px confirmed the 817 px metrics and 1236 px scenario
  sections; the source image rendered at 1015×902 with its exact 79.5 px inner
  offset. At 1280 px and 1920 px the page had no horizontal overflow.
- Independent fidelity/completeness and regression/scope review completed.

## Stop-lines

Stop for a request before Figma writes, merge/rebase into the neighbour’s
branch, deployment, shared-contract changes, or any changes inside the Corvo
source scenes.
