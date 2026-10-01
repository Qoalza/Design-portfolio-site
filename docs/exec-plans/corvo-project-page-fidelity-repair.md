# Corvo project page fidelity repair

## Status

`COMPLETE` — повторный аудит, исправления и итоговая проверка завершены в
изолированной ветке `codex/corvo-fidelity-repair`.

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
2. **Confirmed metrics defects:** the wide adaptive card must precede the
   compact row; the compact cards must remain 384×294; the wide card is
   1176×226 with 843/331 px inner columns and a tiled right background.
3. **Confirmed summary defects:** the 1280 px dashed guide area is 414 px high
   inside the 416 px bordered section; the text-to-notice gap is 40 px.
4. **Confirmed scenario defects:** the 1176 px canvas stays centered while the
   side hatches consume the remaining width, hatch/canvas seams are one pixel,
   and the eyebrow uses Onest Medium 14/16 rather than Source Code Pro.
5. Hero interaction and scene internals remain outside this repair. Its guide
   width is the reference for the summary guides.

## Execution slices

1. **Source audit — complete.** Read the exact Figma hierarchy and visual
   renders for the page, metrics, scenario, long form, design and result;
   collect browser geometry at a 1440 px viewport.
2. **Geometry and styling repair — complete.** Restore metrics order and
   exact internals, correct summary guides/rhythm/background, and center the
   scenario canvas with stretchable side hatches and a single seam.
3. **Fidelity and scope review — complete.** Recheck the exact 1440 px runtime
   plus a wider viewport, then review fidelity/completeness and regression/scope.
4. **Verification and close-out — complete.** Repeat focused tests, full tests,
   lint, build and browser smoke on the final state; commit only this isolated
   repair and do not merge it into the neighbour branch.

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

- Follow-up token audit against the current `3530:154730` source mapped every
  page section rule individually. Header band, intro, action wrapper, Hero
  outer separators, summary rails, metrics, content dividers, result and
  footer now use `Border/Neutral/Thin` (`#1d2124`). The intro metadata divider
  retains its distinct current `#2d3438` role.
- The Hero adaptive ruler remains `#272d30`: its current Figma descendants are
  still bound to the separate `Color/Border/Neutral/Default` variable. Only the
  outer Hero dashed baseline and vertical separation asset changed to Thin.
- Browser computed styles on `/projects/corvo` and the shared
  `/preview/project-responsive-hero` consumer confirm Thin as
  `rgb(29, 33, 36)` while the ruler remains `rgb(39, 45, 48)`.
- Summary side rails reproduce Figma's exact `[16,16]` dash pattern: 16 px
  Thin stroke followed by a 16 px transparent gap.
- Token follow-up verification: focused route/Hero tests 14/14 passing; full
  Concept V2 suite 163/163 passing.

- Follow-up source read for updated node `4140:534347`: hatch top/bottom
  strokes and the complete center-frame stroke now resolve to `#1d2124`;
  the scenario parent has no stroke of its own.
- Replaced the flattened opaque 1015×902 export with the exact transparent
  Figma source at 2030×1804, rendered at 1015×902 as authored. The source is
  77.09% fully transparent, so the native canvas grid remains visible between
  diagram elements. Runtime reports natural size 2030×1804 and no CSS upscale.
- Runtime at 1440 px: summary is `1440×416` on `#121517`; its inner guide
  frame is `(80,1342,1280×414)`, text blocks are 992 px wide, and the notice
  begins at `y=1598` after the exact 40 px gap.
- Runtime at 1440 px: wide metric card is `(132,1961,1176×226)` with inner
  columns `843/331`; compact cards are `384×294` at `y=2199`.
- Runtime at 1440 px: scenario eyebrow is Onest Medium 14/16 at
  `(136,3624)`; the media strip is `132/1176/132` with one-pixel seams.
- Runtime at 1920 px: scenario canvas remains centered at `x=372`, both side
  hatches stretch symmetrically to 372 px, and the summary/Hero 1280 px guide
  frames both begin at `x=320`.
- Hero workspace grid remains 20/320 px, opacity `.6`, major phase `-80px`.
- `node --test tests/project-page-route.test.mjs`: 4/4 passing.
- `npm test`: 162/162 passing; `npm run lint`: passing.
- Production build passed with Vite config runner into
  `/private/tmp/corvo-fidelity-build`; its HTML, CSS and JS artifact smoke
  check passed. The repository browser-check script could not bind a new local
  port in the sandbox, so runtime verification used the already isolated local
  server plus direct browser geometry checks at 1440 and 1920 px.
