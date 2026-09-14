# Concept V2 — финальная визуальная доводка

Status: `READY_FOR_REVIEW`

## Baseline and scope

- Branch: `codex/concept-v2-visual-fidelity`.
- Base: `7b1f3e49180960426b48e9436bfb0d79759f681c` from the accepted About correction workstream.
- Worktree: `/private/tmp/design-portfolio-concept-v2-visual-fidelity`.
- Scope: Concept V2 only — About/viewer fidelity, Experience left fade and decorative dot tile, Process hover, Medium control icons, and stable Hero captions.
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

## Verification

- Focused behavior tests per group, followed by `npm run check`, `npm run check:browser`, and `git diff --check` at the reviewed HEAD.
- Completed: `48/48` automated tests, lint, production build, browser smoke and diff check after the final CSS cleanup.
- Pending manual evidence: browser matrix on the desktop and viewer threshold sizes from Plan 4.0. The desktop automation surface timed out twice, so Chromium, Firefox and WebKit visual runs are explicitly not claimed.

## Final review record

1. Fidelity/completeness: verified the accepted embedded `320×420` / rear `256×336` geometry, the direct viewer `1.5×` scale, border pseudo-element, caption gradient, exact SVG dot tile, Medium SVG frame contract, Process Default/Enable values and Hero timing. Removed obsolete CSS branches that still encoded the prior radial dot fields, complete-state fade hiding and viewer X/Y scales.
2. Regression/scope: reviewed the changed runtime, tests and assets against the accepted baseline. About and viewer controllers remain independent; no Admin, shared contract, production, dependency, push, PR, merge or deploy files entered the workstream. The only remaining untracked path is the local `node_modules` symlink.

## Stop-lines

Stop only the dependent group if an exact Figma source materially conflicts, a required exact exported asset cannot be obtained, unrelated edits overlap, or a requested fix would cross the stated scope. Do not approximate a missing icon, change the embedded deck contract, or introduce an X/Y-specific viewer scale.
