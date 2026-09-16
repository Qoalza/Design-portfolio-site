# HANDOFF

Обновлено: 2026-09-16.

## Checkout

- Branch: `codex/concept-v2-figma-delta-3ec86f0`.
- HEAD: `c392e54` (`fix(concept-v2): keep hero field behind controls`).
- Worktree: `/private/tmp/Design-portfolio-site-concept-v2-delta-3ec86f0`.
- Preview: `http://127.0.0.1:43207/`, launched from this exact worktree.
- `tools/concept-v2/app/node_modules` is an untracked local dependency symlink; never stage it.

## Current result

The current Figma delta is implemented for Concept V2 only: semantic palette, Header, the two authored Hero compositions and lower fact-chip, Projects action, Process roles, AI panel/chip, Experience roles and icon-only Resume control, About roles, Footer, and the exact `Medium / Files / File-05` frame for CV/Resume.

Hero uses the source compositions as separate structures: up to the authored Large canvas width of `2313px`, the runtime shows Small (left copy, right graph, caption above, no eyebrow); at or above it, it shows Large (centred copy with eyebrow, graph below, caption after). The accepted interactive graph/caption mechanics remain intact. On desktop it occupies exactly one viewport. The lower dotted fields use their distinct source exports: `3361:118628` is Small and `3361:138077` is Large; each fills only its own field. `Color/Container/Neutral/Other/Bg-main` is now the current Figma binding `#181a1c`. The field is a background layer rather than an overlay: Hero controls stay clickable and visible, while the lower part of the map fades before it reaches the field, removing the construction-circle bleed. The fact chip hugs its content and sits `44px` above the field edge. Small layout's main composition has the source `120px` bottom inset. The Experience heading retains the full `105×36px` «Резюме» button with File-05, and has no adjacent technical-note caption.

The following accepted mechanics are intentionally untouched: About deck/viewer and custom cursor, Experience gateway/timeline and fade behavior, Hero caption/hysteresis, Process hover/focus timing, shared contract, Admin, production and deploy.

## Verification

- `npm run check`: passed — lint, 64 tests, Vite production build.
- `npm run check:browser`: passed — built runtime smoke.
- `git diff --check`: passed for `c392e54`.
- Firefox and WebKit are not exposed in this environment and therefore remain unverified.

## Review / stop-lines

- Status is `READY_FOR_REVIEW`: review the independent Large/Small Hero fields, the background-only lower field, and the removed semicircular bleed in the current preview.
- No Figma write, Admin/shared change, push, PR, merge, deploy or production action was performed.
- Evidence/source ledger: `docs/audits/concept-v2-current-figma-delta-2026-09-16.md`.
