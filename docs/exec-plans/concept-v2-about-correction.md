# Concept V2 — «Обо мне»: корректирующий этап

Status: `IN_PROGRESS`

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

## Stop-lines

Stop the dependent slice if the current Figma node conflicts materially with the confirmed contract, an exact required asset cannot be obtained, or unrelated changes appear in this worktree.
