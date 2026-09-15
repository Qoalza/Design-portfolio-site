# HANDOFF

Обновлено: 2026-09-15.

## Checkout

- Current branch: `codex/concept-v2-visual-fidelity`.
- Worktree: `/private/tmp/design-portfolio-concept-v2-visual-fidelity`.
- Scope is Concept V2 only. Admin, shared contracts, production, deploy and `USERSPACE/**` are untouched.

## Current checkpoint

- Plan 4.0 remains user-accepted. A subsequent user-reported Experience regression is corrected locally: incoming Lenis inertia now stops at zero progress and a continuous wheel stream stays held indefinitely; only after that stream has actually ended can the next input begin the timeline. There is no hard time-based release. This does not alter the accepted geometry, Header behavior or compact layout. The centered patterned fields now also use Figma’s 1 px vertical 16 px dash / 16 px gap boundaries instead of solid side lines.
- Current local preview: `http://127.0.0.1:43205/` from this exact worktree. Local-browser proof covers `1280×720`, the exact `1440×960` viewer controls, viewer viewport thresholds `1439×960`/`1440×959`, vector cursor hand state and viewer/embedded-state independence. The current `1440×960` browser pass opened embedded «Машина», switched the viewer to «Собачки», and confirmed that the embedded selection remained «Машина» after Escape; other engines remain open.
- `tools/concept-v2/app/node_modules` is an untracked local dependency symlink and must remain out of Git.

## Verification

- Full `npm run check` (lint, 51 tests and production build), browser-runtime smoke and `git diff --check` pass for the Experience side-boundary correction.
- Existing local browser proof: sticky Header has `z-index:20` above the project divider (`8`). The revised Experience entry has automated coverage for the absence of a scroll-capture path, compact heading-only adjustment and tall pinned field balance. Local checks cover `1280×900`, `1280×720`, and `1700×1318`, where both dot fields measure `106px`; user accepted the final preview. Firefox and WebKit were unavailable in the exposed browser inventory, and the separate Chrome automation attempt timed out; those engines are not represented as acceptance.

## Stop-lines

- No Figma write, Admin/shared change, push, PR, merge, deploy or production action.
- Do not stage the local `node_modules` symlink.
- The workstream is complete; do not amend it without a new user-requested scope.

## Next action

No pending action. Start a new workstream only for a new user-requested scope.

## Pointers

- ExecPlan: `docs/exec-plans/concept-v2-visual-fidelity.md`.
- Runtime: `tools/concept-v2/app`.
