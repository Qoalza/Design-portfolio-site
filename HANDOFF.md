# HANDOFF

Обновлено: 2026-09-16.

## Checkout

- Branch: `codex/concept-v2-figma-delta-3ec86f0`.
- Runtime checkpoint: `f3284d9` (`fix(concept-v2): align about border dashes`).
- Worktree: `/private/tmp/Design-portfolio-site-concept-v2-delta-3ec86f0`.
- Preview: `http://127.0.0.1:43207/`, launched from this exact worktree.
- `tools/concept-v2/app/node_modules` is an untracked local dependency symlink; never stage it.

## Current result

The current Figma delta is implemented for Concept V2 only: semantic palette, Header, the two authored Hero compositions and lower fact-chip, Projects action, Process roles, AI panel/chip, Experience roles and icon-only Resume control, About roles, Footer, and the exact `Medium / Files / File-05` frame for CV/Resume.

Hero uses the source compositions as separate structures: up to the authored Large canvas width of `2313px`, the runtime shows Small (left copy, right graph, caption above, no eyebrow); at or above it, it shows Large (centred copy with eyebrow, graph below, caption after). The accepted interactive graph/caption mechanics remain intact. On desktop it occupies exactly one viewport. `Color/Container/Neutral/Other/Bg-main` is the current Figma binding `#181a1c`. The lower field is now a native full-viewport CSS dot tile (`3px` dots on a `16px` grid) over Bg-main, with a scalable vector wave mask that preserves the exact Figma wave path and `75px` blur. The former whole-scene SVG exports were removed: they caused the field to appear inset and allowed its 320px layer to cover the interface. The field now sits behind the main composition, reaches both viewport edges and cannot clip the copy, actions or graph. The desktop dot tile is identical to the accepted `d9d6b21` `320px` lower field. Its mask is `50px` taller and starts `50px` higher while retaining the former lower edge, and is shifted right by `8px`; this extends the wave upward without creating a transparent bottom strip or moving the dot grid. On compact-height desktop only the graph's decorative construction grid is suppressed to prevent a hard overlap line; routes, nodes, lens, geometry and interaction remain unchanged. Mobile Hero keeps the previous accepted CSS unchanged. The fact chip hugs its content and sits `44px` above the field edge. Small layout's main composition has the source `120px` bottom inset. Project preview shade also renders natively and ends in its owning `--surface`, so the Corvo image area and text block use the same background colour. The Experience heading retains the full `105×36px` «Резюме» button with File-05, and has no adjacent technical-note caption.

The Process card rail now has one desktop upper divider: the redundant parent border was removed while its authored card divider, hover/focus fill, and `300ms` timing remain intact. Decorative hatch and dashed fields use the exact exported Figma component stroke `#222629` via `--cv2-decoration-hatch`.

The top and right dashed borders of the About text frame are deliberately separate from those decorative hatches: they use the exact `Color/Border/Neutral/Surface` token from Figma node `3214:124474` — `--cv2-border-neutral-surface` / `#2a2f33`.

The desktop Experience entry gate still consumes the incoming inertial tail, but now recognizes a renewed wheel impulse from its rising delta and releases immediately. A second scroll gesture therefore starts the timeline without requiring pointer movement; the existing `120ms` idle release remains as a fallback for discrete wheel input. Timeline geometry, progress mapping and mobile/native scrolling are unchanged.

The following accepted mechanics are intentionally untouched: About deck/viewer and custom cursor, Experience gateway/timeline and fade behavior, Hero caption/hysteresis, Process hover/focus timing, shared contract, Admin, production and deploy.

## Verification

- `npm run check`: passed — lint, 66 tests, Vite production build.
- `npm run check:browser`: passed — built runtime smoke.
- Focused Hero suite: passed — 15 tests.
- Focused Process suite: passed — 6 tests, including the single desktop divider and Figma hatch-stroke contract.
- Focused Experience suite: passed — 16 tests, including a decaying inertial tail followed by a renewed wheel impulse before the idle timer.
- `git diff --check`: passed for `7d61746`.
- Desktop preview at `1728×900`: `.steps` computes to `border-top: 0px`; the retained card divider computes to `1px`; all checked decorative hatches compute to `rgb(34, 38, 41)` (`#222629`).
- Live preview computed-style check: the About top dash pseudo-element and right divider both compute to `rgb(42, 47, 51)` (`#2a2f33`), matching `Color/Border/Neutral/Surface` from Figma node `3214:124474`.
- Desktop visual review at the reported compact viewport `1728×465`, Small `1440×900` and Large `2313×1200` confirmed edge-to-edge dots, intact interface content and no hard construction-grid line in the lower field.
- Firefox and WebKit are not exposed in this environment and therefore remain unverified.

## Review / stop-lines

- Status is `READY_FOR_REVIEW`: verify that desktop Experience stops the incoming inertia and begins on the next scroll gesture without pointer movement. Mobile/native scrolling is explicitly unchanged in this group.
- No Figma write, Admin/shared change, push, PR, merge, deploy or production action was performed.
- Evidence/source ledger: `docs/audits/concept-v2-current-figma-delta-2026-09-16.md`.
