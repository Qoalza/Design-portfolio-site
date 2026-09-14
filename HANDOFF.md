# HANDOFF

Обновлено: 2026-09-15.

## Checkout

- Current branch: `codex/concept-v2-visual-fidelity`.
- Worktree: `/private/tmp/design-portfolio-concept-v2-visual-fidelity`.
- Scope is Concept V2 only. Admin, shared contracts, production, deploy and `USERSPACE/**` are untouched.

## Current checkpoint

- Plan 4.0 implementation is ready for review. The final audit removed superseded card/viewer scales, old dot gradients and complete-state fade suppression rather than relying on CSS override order. A subsequent user visual report restored the detached About caption-gradient layer and corrected viewer arrows to the Figma dark Filled Square state at `x=332/1072`; `7758bdc` additionally replaces the unreliable native browser cursor with the same full-frame vector layer and semantic arrow/hand states. `2ac1f5a` adds the user-requested 150ms bidirectional sticky Header transition, keeps its `Border/Surface` underline above project-card layers, and reserves its 80px height in the desktop Experience sticky scene.
- Current local preview: `http://127.0.0.1:43205/` from this exact worktree. Local-browser proof covers `1280×720`, the exact `1440×960` viewer controls, viewer viewport thresholds `1439×960`/`1440×959`, vector cursor hand state and viewer/embedded-state independence; other engines remain open.
- `tools/concept-v2/app/node_modules` is an untracked local dependency symlink and must remain out of Git.

## Verification

- `npm run check`: passed — lint, `50/50` tests, production build.
- `npm run check:browser`: passed — built runtime smoke.
- `git diff --check`: passed.
- Local browser proof: sticky Header has `z-index:20` above the project divider (`8`), and the Experience sticky scene starts at `80px` with the remaining viewport height. Firefox and WebKit are unavailable in the exposed browser inventory. The separate Chrome automation attempt timed out; it must not be represented as an additional engine result.

## Stop-lines

- No Figma write, Admin/shared change, push, PR, merge, deploy or production action.
- Do not stage the local `node_modules` symlink.
- Do not call this workstream complete until the outstanding manual visual matrix is accepted or explicitly deferred by the user.

## Next action

Obtain explicit user visual acceptance or an environment with Firefox/WebKit, then record the outcome and close the ExecPlan only if no discrepancy remains.

## Pointers

- ExecPlan: `docs/exec-plans/concept-v2-visual-fidelity.md`.
- Runtime: `tools/concept-v2/app`.
