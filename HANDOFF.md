# HANDOFF

Обновлено: 2026-09-14.

## Checkout

- Current branch: `codex/concept-v2-visual-fidelity`.
- Worktree: `/private/tmp/design-portfolio-concept-v2-visual-fidelity`.
- Scope is Concept V2 only. Admin, shared contracts, production, deploy and `USERSPACE/**` are untouched.

## Current checkpoint

- Plan 4.0 implementation is ready for review. The final audit removed superseded card/viewer scales, old dot gradients and complete-state fade suppression rather than relying on CSS override order. A subsequent user visual report restored the detached About caption-gradient layer and corrected viewer arrows to the Figma dark Filled Square state at `x=332/1072`.
- Current local preview: `http://127.0.0.1:43205/` from this exact worktree. Partial local-browser visual proof at `1280×720` covers viewer controls, restored caption gradient and viewer/embedded-state independence; the wider engine matrix remains open.
- `tools/concept-v2/app/node_modules` is an untracked local dependency symlink and must remain out of Git.

## Verification

- `npm run check`: passed — lint, `48/48` tests, production build.
- `npm run check:browser`: passed — built runtime smoke.
- `git diff --check`: passed.
- The computer-use surface timed out twice; Chromium, Firefox and WebKit visual matrices remain unverified and must not be represented as complete.

## Stop-lines

- No Figma write, Admin/shared change, push, PR, merge, deploy or production action.
- Do not stage the local `node_modules` symlink.
- Do not call this workstream complete until the outstanding manual visual matrix is accepted or explicitly deferred by the user.

## Next action

Run the desktop and viewer visual matrix in Chromium/Firefox and the required WebKit subset, then record the outcome and close the ExecPlan only if no discrepancy remains.

## Pointers

- ExecPlan: `docs/exec-plans/concept-v2-visual-fidelity.md`.
- Runtime: `tools/concept-v2/app`.
