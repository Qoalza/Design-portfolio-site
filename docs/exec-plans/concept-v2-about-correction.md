# Concept V2 — «Обо мне»: корректирующий этап

Status: `COMPLETE` — approved by the user on the current branch; deferred viewer/card refinements are intentionally outside this completed stage.

## Baseline

- Branch: `codex/concept-v2-about-correction`.
- Base: `3fe274a48d29caf0a96a599a13e97881b9e277dc`.
- Worktree: `/private/tmp/design-portfolio-concept-v2-about-correction`.
- Source: Figma `sgKtUASp0aYzdkeH8kcXrL`; block `3223:139418`, carousel `3215:124481`, preview `3223:155421`, hover `3223:155136`, viewer `3223:139419`.

## Contract

- Preserve the approved post-baseline site intact, including the experience grid and its current contrast.
- Build the About block from the current Figma source, not from the earlier failed branch.
- The three-card handoff remains cyclic, parallel and 500 ms; captions scale proportionally with their fixed internal composition and never reflow during movement.
- Scope excludes Figma writes, Admin/shared/production changes, push, merge and deploy.

## Git groups

1. Baseline and source mapping.
2. Static Figma structure, assets and controls.
3. Card handoff, proportional caption scaling and effects.
4. Hover and image viewer.
5. Final evidence and one implementation self-review.

## Superseded checkpoints

- `3522012`: baseline/source passport.
- `158fd30`: native About structure, source assets, fixed internal card stages and control wiring.
- `2781770`: stable proportional handoff and hover interaction.
- `887eac2`: enlarged viewer and keyboard/scroll lifecycle.
- The prior evidence and checkpoint `15d7eb5a5382e337cc465154f3a93932d64bf0b1` are not acceptance evidence for Plan 3.0. They remain history only.

## Completed implementation state

- Current branch/worktree and baseline remain the source of truth; no work is resumed on the failed older implementation.
- Current work addresses exact Plan 3.0 findings: source-accurate hatch geometry and borders, central alignment, static caption typography, an interruptible 500 ms handoff, full-surface hover action, and independent viewer state.
- The accepted scope includes the correct approved baseline, About structure, section rules and hatch fields, 16/24 subtitle, 0.8× rear-card composition, compact 500 ms handoff, proportional embedded-card scale, captions, full-card hover interaction and independent viewer state.
- Focused motion checks (including rapid retargeting), `npm run check`, `npm run check:browser`, and `git diff --check` passed on final HEAD `94f6f9c2ca55562a2a534c2c3fe97793abeb5f19`. The user visually accepted this scope.
- Current local preview was launched only from this worktree; no deploy/merge/push is in scope.

## Deferred to a new goal

- The enlarged-image viewer's direct 1.5× card geometry and any remaining viewer-preview refinements.
- The remaining visual refinements to the image cards themselves, including their border and embedded caption-gradient treatment where still needed.
- The broader site-wide icon, point-pattern, process-hover and experience-fade work requested after this stage. These are not silently included in this completed About stage.

## Stop-lines

Stop the dependent slice if the current Figma node conflicts materially with the confirmed contract, an exact required asset cannot be obtained, or unrelated changes appear in this worktree.
