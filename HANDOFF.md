# HANDOFF

Обновлено: 2026-09-17.

## Checkout

- Branch: `codex/concept-v2-figma-delta-3ec86f0`.
- Runtime checkpoint: `c0a9832` (`fix(concept-v2): soften large hero wave`).
- Worktree: `/private/tmp/design-portfolio-concept-v2-latest`.
- Preview: `http://127.0.0.1:43208/`, launched from this exact worktree.
- `tools/concept-v2/app/node_modules` is an untracked local dependency symlink; never stage it.

## Current result

The current Figma delta is implemented for Concept V2 only: semantic palette, Header, the two authored Hero compositions and lower fact-chip, Projects action, Process roles, AI panel/chip, Experience roles and icon-only Resume control, About roles, Footer, and the exact `Medium / Files / File-05` frame for CV/Resume.

Hero uses the source compositions as separate structures: up to the authored Large canvas width of `2313px`, the runtime shows Small (left copy, right graph, caption above, no eyebrow); at or above it, it shows Large (centred copy with eyebrow, graph below, caption after). The accepted interactive graph/caption mechanics remain intact. On desktop it occupies exactly one viewport. `Color/Container/Neutral/Other/Bg-main` is the current Figma binding `#181a1c`. The lower field is now a native full-viewport CSS dot tile (`3px` dots on a `16px` grid) over Bg-main, with a scalable vector wave mask that preserves the exact Figma wave path and `75px` blur. The former whole-scene SVG exports were removed: they caused the field to appear inset and allowed its 320px layer to cover the interface. The field now sits behind the main composition, reaches both viewport edges and cannot clip the copy, actions or graph. The desktop dot tile is identical to the accepted `d9d6b21` `320px` lower field. Its mask is now `100px` taller and starts `100px` higher while retaining the former lower edge, and remains shifted right by `8px`; this reveals more dots without creating a transparent bottom strip or moving the dot grid. On compact-height desktop only the graph's decorative construction grid is suppressed to prevent a hard overlap line; routes, nodes, lens, geometry and interaction remain unchanged. Mobile Hero keeps the previous accepted CSS unchanged. The fact chip hugs its content and sits `44px` above the field edge. Small layout's main composition has the source `120px` bottom inset. Project preview shade also renders natively and ends in its owning `--surface`, so the Corvo image area and text block use the same background colour. The Experience heading retains the full `105×36px` «Резюме» button with File-05, and has no adjacent technical-note caption.

The user-requested Large central composition is raised a further `50px` (`translateY(-74.5px)`). This affects only the copy, controls and graph container; the independent dotted lower field stays at its existing coordinates. Large now has a dedicated vector wave: its sides rise above the centre, but the centre is deliberately shallow enough to pass beneath the fact chip instead of wrapping around it. A `115px` blur and expanded filter bounds make that transition gradual without clipped edges. Large dots are `4×4px` on the same `16px` grid at `0 0`; Small retains the source wave and `3×3px` dots.

On desktop, the Hero dot wave mask is isolated to `.hero-bottom-dots`. The diagram construction strokes no longer receive a second CSS vertical fade; they retain only the original radial mask authored inside `SvgNetwork`, so the dot fade cannot dim the scheme. Below the desktop breakpoint the previous construction mask is preserved unchanged.

The Process card rail now has one desktop upper divider: the redundant parent border was removed while its authored card divider, hover/focus fill, and `300ms` timing remain intact. Decorative hatch and dashed fields use the exact exported Figma component stroke `#222629` via `--cv2-decoration-hatch`.

The top and right dashed borders of the About text frame are deliberately separate from those decorative hatches: they use the exact `Color/Border/Neutral/Surface` token from Figma node `3214:124474` — `--cv2-border-neutral-surface` / `#2a2f33`.

The desktop Experience entry gate records the latest wheel timestamp before capture. After snapping, uninterrupted inertia remains blocked, while the first event after a `48ms` gesture boundary releases Lenis even when its delta is equal or smaller. The rising-delta detector and existing `120ms` idle release remain fallback paths. Pointer movement does not participate. Timeline geometry, progress mapping and mobile/native scrolling are unchanged.

The following accepted mechanics are intentionally untouched: About deck/viewer and custom cursor, Experience gateway/timeline and fade behavior, Hero caption/hysteresis, Process hover/focus timing, shared contract, Admin, production and deploy.

## Verification

- `npm run check`: passed — lint, 67 tests, Vite production build.
- `npm run check:browser`: passed — built runtime smoke.
- Focused Hero suite: passed — 15 tests.
- Large runtime inspection at `2313×1652`: the field is still `2313×560px` at the bottom (`y: 1092`), the grid remains `16px` at `0 0`, and its computed Large-only mask is `hero-bottom-wave-mask-large.svg` with `4×4px` dots.
- The current Large-mask contract sets its central curve at `286` (previously `370`) and uses a `115px` Gaussian blur (previously `75px`), so the middle is higher and the dot fade is gentler.
- Large runtime inspection at `2313×1200`: variant is `large`, its central layout computes to `translateY(-74.5px)`, and the independent dotted field remains at `top: 640px`, `height: 560px`.
- Desktop Hero wave contract now verifies the additional `50px` upward extension (`+100px` mask height / `-108px` position); the dot tile position and mobile rule remain unchanged.
- Desktop Hero visual check at `1568×918`: the dot field retains `hero-bottom-wave-mask.svg`, while the construction layer computes only its intrinsic `url(#…-grid)` SVG mask and remains visible over the wave transition. At `597×998`, the pre-existing radial + vertical construction mask remains intact.
- Focused Process suite: passed — 6 tests, including the single desktop divider and Figma hatch-stroke contract.
- Focused Experience suite: passed — 17 tests, including a second gesture whose first delta is equal to the final inertial delta and which occurs without pointer movement.
- Exact desktop browser reproduction at `1440×900`: the first `5000px` wheel gesture snapped Experience at `scrollY=2945`, `gate=holding`, `progress=0`; a second `120px` wheel gesture at the same pointer coordinates `(720,450)` changed the state to `released` and progress to `0.0212`. No pointer event was dispatched between gestures.
- `git diff --check`: passed for the current Experience gate group.
- Desktop preview at `1728×900`: `.steps` computes to `border-top: 0px`; the retained card divider computes to `1px`; all checked decorative hatches compute to `rgb(34, 38, 41)` (`#222629`).
- Live preview computed-style check: the About top dash pseudo-element and right divider both compute to `rgb(42, 47, 51)` (`#2a2f33`), matching `Color/Border/Neutral/Surface` from Figma node `3214:124474`.
- Desktop visual review at the reported compact viewport `1728×465`, Small `1440×900` and Large `2313×1200` confirmed edge-to-edge dots, intact interface content and no hard construction-grid line in the lower field.
- Firefox and WebKit are not exposed in this environment and therefore remain unverified.

## Review / stop-lines

- Status is `READY_FOR_REVIEW`: verify that desktop Experience stops the incoming inertia and begins on the next scroll gesture without pointer movement. Mobile/native scrolling is explicitly unchanged in this group.
- No Figma write, Admin/shared change, push, PR, merge, deploy or production action was performed.
- Evidence/source ledger: `docs/audits/concept-v2-current-figma-delta-2026-09-16.md`.
