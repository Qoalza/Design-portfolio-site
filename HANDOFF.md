# HANDOFF

Обновлено: 2026-09-16.

## Checkout

- Branch: `codex/concept-v2-figma-delta-3ec86f0`.
- Runtime checkpoint: `393ecf6` (`fix(concept-v2): use exact desktop hero fields`).
- Worktree: `/private/tmp/Design-portfolio-site-concept-v2-delta-3ec86f0`.
- Preview: `http://127.0.0.1:43207/`, launched from this exact worktree.
- `tools/concept-v2/app/node_modules` is an untracked local dependency symlink; never stage it.

## Current result

The current Figma delta is implemented for Concept V2 only: semantic palette, Header, the two authored Hero compositions and lower fact-chip, Projects action, Process roles, AI panel/chip, Experience roles and icon-only Resume control, About roles, Footer, and the exact `Medium / Files / File-05` frame for CV/Resume.

Hero uses the source compositions as separate structures: up to the authored Large canvas width of `2313px`, the runtime shows Small (left copy, right graph, caption above, no eyebrow); at or above it, it shows Large (centred copy with eyebrow, graph below, caption after). The accepted interactive graph/caption mechanics remain intact. On desktop it occupies exactly one viewport. `Color/Container/Neutral/Other/Bg-main` is the current Figma binding `#181a1c`. The lower dotted field uses its exact Figma SVG scene per desktop composition: Small `1440×320` and Large `2313×560`, including the source dots, wave fade, gradient and blur. It is a full-width vector field above the bottom of the source map, so the map grid never leaks into the field; the map's geometry, interactivity and caption stay unchanged. Mobile Hero keeps the previous accepted CSS unchanged. The fact chip hugs its content and sits `44px` above the field edge. Small layout's main composition has the source `120px` bottom inset. Project preview shade also renders natively and ends in its owning `--surface`, so the Corvo image area and text block use the same background colour. The Experience heading retains the full `105×36px` «Резюме» button with File-05, and has no adjacent technical-note caption.

The following accepted mechanics are intentionally untouched: About deck/viewer and custom cursor, Experience gateway/timeline and fade behavior, Hero caption/hysteresis, Process hover/focus timing, shared contract, Admin, production and deploy.

## Verification

- `npm run check`: passed — lint, 64 tests, Vite production build.
- `npm run check:browser`: passed — built runtime smoke.
- `git diff --check`: passed for `393ecf6`.
- Desktop visual review at exact Small `1440×900` and Large `2313×1200` confirmed the respective full-width Figma field, with the map grid absent from the field.
- Firefox and WebKit are not exposed in this environment and therefore remain unverified.

## Review / stop-lines

- Status is `READY_FOR_REVIEW`: review desktop Small/Large Hero fields, especially the full unmasked map and lower dotted wave. Mobile Hero is explicitly out of scope and unchanged in this group.
- No Figma write, Admin/shared change, push, PR, merge, deploy or production action was performed.
- Evidence/source ledger: `docs/audits/concept-v2-current-figma-delta-2026-09-16.md`.
