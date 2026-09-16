# HANDOFF

Обновлено: 2026-09-16.

## Checkout

- Branch: `codex/concept-v2-figma-delta-3ec86f0`.
- HEAD: `d029658` (`fix(concept-v2): separate hero field variants`).
- Worktree: `/private/tmp/Design-portfolio-site-concept-v2-delta-3ec86f0`.
- Preview: `http://127.0.0.1:43207/`, launched from this exact worktree.
- `tools/concept-v2/app/node_modules` is an untracked local dependency symlink; never stage it.

## Current result

The current Figma delta is implemented for Concept V2 only: semantic palette, Header, the two authored Hero compositions and lower fact-chip, Projects action, Process roles, AI panel/chip, Experience roles and icon-only Resume control, About roles, Footer, and the exact `Medium / Files / File-05` frame for CV/Resume.

Hero uses the source compositions as separate structures: up to the authored Large canvas width of `2313px`, the runtime shows Small (left copy, right graph, caption above, no eyebrow); at or above it, it shows Large (centred copy with eyebrow, graph below, caption after). The accepted interactive graph/caption mechanics remain intact. On desktop it occupies exactly one viewport. The lower dotted fields are separate exact Figma exports: `3361:118628` is a `1440×320px` Small canvas and `3361:138077` is a `2313×560px` Large canvas. Neither is stretched into the other. The opaque `Bg-Main` lower-field layer owns its fade and blocks the graph beneath, so its construction circle cannot bleed into the dot field. The fact chip hugs its content and sits `44px` above the field edge. Small layout's main composition has the source `120px` bottom inset. The Experience heading retains the full `105×36px` «Резюме» button with File-05, and has no adjacent technical-note caption.

The following accepted mechanics are intentionally untouched: About deck/viewer and custom cursor, Experience gateway/timeline and fade behavior, Hero caption/hysteresis, Process hover/focus timing, shared contract, Admin, production and deploy.

## Verification

- `npm run check`: passed — lint, 64 tests, Vite production build.
- `npm run check:browser`: passed — built runtime smoke.
- `git diff --check`: passed for `d029658`.
- Firefox and WebKit are not exposed in this environment and therefore remain unverified.

## Review / stop-lines

- Status is `READY_FOR_REVIEW`: review the independent Large/Small Hero fields and the removed semicircular bleed in the current preview.
- No Figma write, Admin/shared change, push, PR, merge, deploy or production action was performed.
- Evidence/source ledger: `docs/audits/concept-v2-current-figma-delta-2026-09-16.md`.
