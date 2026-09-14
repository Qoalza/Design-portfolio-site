# Concept V2 — финальная визуальная доводка

Status: `READY_FOR_REVIEW`

## Baseline and scope

- Branch: `codex/concept-v2-visual-fidelity`.
- Base: `7b1f3e49180960426b48e9436bfb0d79759f681c` from the accepted About correction workstream.
- Worktree: `/private/tmp/design-portfolio-concept-v2-visual-fidelity`.
- Scope: Concept V2 only — About/viewer fidelity, Experience left fade and decorative dot tile, Process hover, Medium control icons, stable Hero captions, and the user-requested sticky Header behavior.
- Excluded: Figma writes, Admin/shared/production, dependencies, push, PR, merge, deploy and mobile redesign.

## Locked sources and contracts

- About cards: `3223:155421`, hover `3223:155136`, viewer `3223:139419`, scaled viewer instance `3263:179635`.
- Process states: `3210:124239`; current section content: `3075:60247`.
- Experience: `3142:82981`; dot tile: `3116:67455` / `3216:124501`.
- Medium icon sources: Concept V2 header/buttons plus icon-library nodes `30902:446` Search-scale and `30903:460` Search.
- Embedded deck remains `320×420` front, `256×336` rear, `−80px` rear overlap and a 480px motion stage.
- Viewer becomes the same deck at one uniform `1.5×` scale: front `480×630`, rear `384×504`, rear overlap `−120px`; selection state remains independent.

## Delivery groups

1. Medium control-icon assets, Hero dynamic icon weight, source ledger and focused test.
2. About card border/gradient and uniform 1.5× viewer geometry.
3. Experience complete-state left fade and exact 3px/16px decorative dot tile.
4. Process-card Figma hover state and project-divider-equivalent top line.
5. Hero caption resolver: 64px entry, 80px exit, immediate nearest-node response, 160ms default delay, 300ms crossfade with a 6px vertical travel. The initial 80ms settle / 150ms transition was superseded by user feedback because it made the established Hero mechanic feel inert.
6. Fidelity then regression review; final evidence, QA and handoff. Automated audit is complete; browser visual matrix remains ready for manual review.
7. Sticky Header: enters and exits from the top over 150ms; uses `Border/Surface` as its lower inset line; its shell carries the active stacking context above project-card decor. Experience stays in its natural flow until the Header pins; it never captures, stops or jumps smooth scrolling. For pinned desktop heights at least `1026px`, the grid is calculated from the Header-free viewport so its top and bottom dot fields are equal. Below `1026px`, the full-height compact composition is retained; heading and track move together by `48px` over `180ms`, while the progress-bar gap is capped at `24px` so the bar rises toward the motion scheme instead of sitting at the lower edge.
8. Post-review corrections: `fac073f` fixes the Experience offset boundary; `7505593` replaces the staged About handoff curve with one shared smooth eased transition for the embedded deck and viewer, removing the outward spread and sequential cadence. `21bc4ce` carries a bounded, decaying current velocity only when an in-flight deck transition is retargeted, preventing a hard velocity cut without reinstating staged paths. `0f125c3` removes the forced Experience entry gateway after direct visual feedback about magnetic scrolling and cramped pinned composition. `c9dd2fb` softens the compact-only heading adjustment; `63f70c9` balances the tall pinned dot fields from the Header-free height; `89c8c6a` caps the compact progress gap and uses the recovered room for the lower heading/track position.

## Verification

- Focused behavior tests per group, followed by `npm run check`, `npm run check:browser`, and `git diff --check` at the reviewed HEAD. Post-review proof at `6bad252`: `50/50` tests, lint, production build, browser smoke and diff check. Experience tests reject the removed gateway and its forced `scrollTo` / Lenis stop path, retain the `81/80px` Header threshold contract, assert the compact-only `48px`/`180ms` heading-track transition plus a `24px` progress gap, and prove tall pinned grids total exactly the Header-free viewport height. Visual checks cover `1280×900`, `1280×720`, and `1700×1318`; the latter confirms `106px` top and bottom dot fields. About tests cover the shared direct eased path for both directions, bounded 120fps samples and momentum-preserving rapid retargets.
- Completed: `49/49` automated tests, lint, production build, browser smoke and diff check after the cursor/runtime correction. A post-audit visual report restored the accidentally detached About caption-gradient layer and aligned the viewer arrows to Figma's dark Filled Square state and `x=332/1072` coordinates; the focused About test, lint, build, smoke and diff checks were rerun.
- Manual local-browser evidence: at `1280×720`, the restored embedded-card gradient, exact `16×16` dot tile and full-frame vector cursor layer render; the cursor changes to the vector hand over an active card while the native cursor is hidden. At `1440×960`, the viewer has exact front `480×630 @ 480,117`, controls at `332/1072,414`, and close `107×36 @ 1057,48`. At `1439×960` and `1440×959`, it uses one reduced composition scale and the entire front card remains visible. The current `1440×960` pass opened embedded «Машина», moved only the viewer to «Собачки», and returned with embedded «Машина» still selected after Escape. Firefox and WebKit are not exposed by this environment. A separate Chrome automation attempt timed out, so Chrome is not claimed as an additional engine result.

## Final review record

1. Fidelity/completeness: verified the accepted embedded `320×420` / rear `256×336` geometry, the direct viewer `1.5×` scale, border pseudo-element, caption gradient, exact SVG dot tile, Medium SVG frame contract, Process Default/Enable values and Hero timing. Removed obsolete CSS branches that still encoded the prior radial dot fields, complete-state fade hiding and viewer X/Y scales.
2. Regression/scope: reviewed the changed runtime, tests and assets against the accepted baseline. About and viewer controllers remain independent; no Admin, shared contract, production, dependency, push, PR, merge or deploy files entered the workstream. The only remaining untracked path is the local `node_modules` symlink. The post-review browser smoke passed; direct visual acceptance of the new Experience threshold and the revised deck feel remains outstanding.

## Stop-lines

Stop only the dependent group if an exact Figma source materially conflicts, a required exact exported asset cannot be obtained, unrelated edits overlap, or a requested fix would cross the stated scope. Do not approximate a missing icon, change the embedded deck contract, or introduce an X/Y-specific viewer scale.
