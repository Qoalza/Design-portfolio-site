# HANDOFF

Обновлено: 2026-09-15.

## Checkout

- Current branch: `codex/concept-v2-visual-fidelity`.
- Worktree: `/private/tmp/design-portfolio-concept-v2-visual-fidelity`.
- Scope is Concept V2 only. Admin, shared contracts, production, deploy and `USERSPACE/**` are untouched.

## Current checkpoint

- Plan 4.0 implementation is ready for review. The final audit removed superseded card/viewer scales, old dot gradients and complete-state fade suppression rather than relying on CSS override order. A subsequent user visual report restored the detached About caption-gradient layer and corrected viewer arrows to the Figma dark Filled Square state at `x=332/1072`; `7758bdc` additionally replaces the unreliable native browser cursor with the same full-frame vector layer and semantic arrow/hand states. `2ac1f5a` adds the user-requested 150ms bidirectional sticky Header transition and keeps its `Border/Surface` underline above project-card layers. `0f125c3` removes the Experience scroll-capture path entirely: no forced snap, no Lenis stop and no scroll jump. `c9dd2fb` softens the compact-only offset. `63f70c9` calculates tall pinned Experience geometry from the `80px` Header-free viewport, keeping its top and bottom dot fields equal. `89c8c6a` moves the compact heading/track by `48px` and caps its progress gap at `24px`, visibly lifting the bar toward the motion scheme.
- Current local preview: `http://127.0.0.1:43205/` from this exact worktree. Local-browser proof covers `1280×720`, the exact `1440×960` viewer controls, viewer viewport thresholds `1439×960`/`1440×959`, vector cursor hand state and viewer/embedded-state independence. The current `1440×960` browser pass opened embedded «Машина», switched the viewer to «Собачки», and confirmed that the embedded selection remained «Машина» after Escape; other engines remain open.
- `tools/concept-v2/app/node_modules` is an untracked local dependency symlink and must remain out of Git.

## Verification

- `npm run check`: passed — lint, `50/50` tests and production build at `6bad252`.
- `npm run check:browser`: passed — built runtime smoke at `6bad252`.
- `git diff --check`: passed.
- Existing local browser proof: sticky Header has `z-index:20` above the project divider (`8`). The revised Experience entry has automated coverage for the absence of a scroll-capture path, Header threshold, compact `48px`/`24px` spacing and tall pinned field balance. Local checks cover `1280×900`, `1280×720`, and `1700×1318`, where both dot fields measure `106px`; the current `1280×900` preview confirms the compact Header/Experience composition from this exact checkout. It still requires direct user visual acceptance. Firefox and WebKit are unavailable in the exposed browser inventory. The separate Chrome automation attempt timed out; it must not be represented as an additional engine result.

## Stop-lines

- No Figma write, Admin/shared change, push, PR, merge, deploy or production action.
- Do not stage the local `node_modules` symlink.
- Do not call this workstream complete until the outstanding manual visual matrix is accepted or explicitly deferred by the user.

## Next action

Obtain direct user visual acceptance that Experience enters with ordinary scrolling and retains sufficient space both before and under the pinned Header, then check the unified About/viewer motion. Record the outcome and close the ExecPlan only if no discrepancy remains.

## Pointers

- ExecPlan: `docs/exec-plans/concept-v2-visual-fidelity.md`.
- Runtime: `tools/concept-v2/app`.
