# Concept V2 — финальная визуальная доводка

Status: `IN_PROGRESS`

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
5. Hero caption resolver: 64px entry, 80px exit, 80ms candidate settle, 160ms default delay, 150ms crossfade.
6. Fidelity then regression review; final evidence, QA and handoff.

## Verification

- Focused behavior tests per group, followed by `npm run check`, `npm run check:browser`, and `git diff --check` at final HEAD.
- Browser checks on the desktop matrix and viewer threshold sizes from Plan 4.0.
- Chromium and Firefox full flow; WebKit viewer, keyboard, mask and scroll-width where available.

## Stop-lines

Stop only the dependent group if an exact Figma source materially conflicts, a required exact exported asset cannot be obtained, unrelated edits overlap, or a requested fix would cross the stated scope. Do not approximate a missing icon, change the embedded deck contract, or introduce an X/Y-specific viewer scale.
