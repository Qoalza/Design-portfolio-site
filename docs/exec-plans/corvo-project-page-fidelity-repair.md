# Corvo project page fidelity repair

## Status

`COMPLETE` — implementation is isolated on `codex/corvo-fidelity-repair`.

## Outcome

Bring the current Concept V2 route `/projects/corvo` into measured agreement
with Figma node `3530:154730`, while preserving the approved Hero interaction
and every working part outside the confirmed visual defects.

## Scope and boundaries

- **In scope:** the Corvo page layout and presentation CSS, its focused route
  checks, and the approved Figma assets already in the worktree.
- **Out of scope:** Figma writes, Hero interaction or scene internals,
  production Portfolio, Admin/shared contract, merge, deploy, and the active
  `codex/redesign-portfolio` worktree owned by the neighbouring chat.
- **Risk:** ELEVATED visual regression. The source of truth is the current
  Figma page at 1440 px; runtime behavior is preserved unless an exact visual
  defect requires a local presentation change.

## Evidence and audit findings

1. The runtime and Figma have the same section boundaries: header 145 px,
   intro 216 px, Hero 980 px, summary 416 px, metrics 817 px, long form
   1042 px, scenario 1236 px, design 887 px, result 541 px, footer 61 px.
2. The three compact metric cards, wide metric card, Hero workspace grid and
   scenario canvas have matching measured dimensions and grid phases.
3. **Confirmed defect:** the scenario header used a generic 56 px top padding.
   In Figma its eyebrow starts at `x=136,y=3624`, title at `y=3652`, and copy
   at `y=3724`; the runtime placed them 48/48/36 px too low. The media canvas
   itself starts at the correct `y=3836`, so only this header is repaired.

## Execution slices

1. **Source audit — complete.** Read the exact Figma hierarchy and visual
   renders for the page, metrics, scenario, long form, design and result;
   collect browser geometry at a 1440 px viewport.
2. **Scenario header repair — complete.** Set the exact
   `8px 56px 0` header padding and the 24 px title-to-copy gap. Add a focused
   regression assertion for both values.
3. **Fidelity and scope review — complete.** Rechecked the Hero grid,
   scenario background, lower content blocks, and final diff. Remove or amend
   any finding before finalizing; do not alter components without evidence.
4. **Verification and close-out — complete.** Focused route checks, full app
   tests (162 passing), lint, production build and browser smoke passed from
   this worktree. Commit only this isolated repair; do not merge it into the
   neighbour branch.

## Acceptance criteria

- At 1440 px, section starts and heights match the Figma measurements above.
- Scenario header coordinates are eyebrow `(136,3624)`, title `(136,3652)`,
  copy `(136,3724)`; canvas begins at `y=3836` and its artwork stays at
  `(211.5,3886)`.
- The Hero retains its existing tabs, resize behavior and Figma grid phase.
- No changes outside the Corvo Concept V2 page, its tests, and this plan.
- Final focused tests, application tests, lint, build and browser smoke pass.

## Stop lines

Stop and record the decision before any Figma write, change to Hero behavior
or scene assets, shared/public contract change, dependency change, merge,
deploy, or interaction with the neighbouring worktree.

## Final evidence

- Runtime at 1440 px: scenario eyebrow `(136,3624)`, title `(136,3652)`,
  copy `(136,3724)`; the scenario canvas stays at `y=3836`.
- Runtime at 1440 px: the design notice remains `(132,5500,1000×118)` after
  restoring the Figma text rhythm.
- `node --test tests/project-page-route.test.mjs`: 4/4 passing.
- `npm test`: 162/162 passing; `npm run lint`: passing; `npm run build`:
  passing; `npm run check:browser`: passing.
