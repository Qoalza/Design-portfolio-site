# HANDOFF

Обновлено: 2026-09-20.

## Checkout

- Branch: `codex/concept-v2-figma-delta-3ec86f0`.
- Worktree: `/private/tmp/design-portfolio-concept-v2-latest`.
- Tested runtime SHA: `7ea0c27` (`fix(concept-v2): restore project preview shade`).
- Documentation/evidence is committed after that runtime SHA and must not be read as a rebuilt runtime.
- `tools/concept-v2/app/node_modules` is an untracked local dependency symlink; never stage it.

## Current checkpoint

- The Concept V2 runtime-optimization plan G1–G5 is implemented and recorded as `READY_FOR_REVIEW`.
- G1: finite frame/activity scheduling and Hero map lifecycle.
- G2: Experience geometry invalidation and offscreen/static cleanup.
- G3: finite Header/cursor/lens/About pointer work and safe reduced-motion deck settlement.
- G4: rendered-media preparation contract with About source selection and Projects fallback-only behavior.
- Final automated evidence for the tested runtime: `npm run check` (86 tests, lint and Vite production build), `npm run check:browser` (HTTP built-runtime smoke) and `git diff --check` passed.
- Follow-up: Project previews now have 640 px and 1080 px AVIF candidates with an unchanged PNG fallback. Their real rendered maximum is 519 px, so the 1080 px candidate covers a 2× Retina/5K display without upscaling.
- Revised scoped correction: project-card pointer hover is immediately suppressed for physical and Lenis scrolling, then returns under a stationary pointer after settlement. It uses a synchronous document-level gate at wheel input instead of a deferred React render; the original layers and image `box-shadow` remain intact.
- Visual correction: the desktop preview now uses the exact exported Figma shade vector (`638×328`) between the back and front artwork. The CSS radial-gradient approximation was the cause of the missing depth; no hover, geometry, animation or image layer was changed.
- This correction passed `npm run check` (90 tests, lint and Vite production build), `npm run check:browser`, `git diff --check`, and a Chromium pass covering the original rest shadow, wheel-time hover suppression and post-settlement restoration.

## Acceptance and stop-lines

- The manual Zen feel/performance pass is still required; automated smoke checks do not replace it. Its latest target is the first entry into Projects with a stationary cursor over either card.
- No Figma write, public Portfolio, Admin, shared contract, canonical content/assets, dependency, push, PR, merge, deploy or production action occurred.
- Lenis and Experience blur/masks remain unchanged. Project AVIF derivatives are a separate, user-authorized follow-up; their geometry, layers, effects and PNG fallback remain unchanged.

## Next action

- Perform the Zen acceptance pass for Hero → Projects → Experience, with a fresh pass over first entry into Projects after the scroll-hover correction and visual comparison of the restored preview shade. After an explicit request, push the local commit series or prepare the next scoped correction.

## Pointers

- Execution record: `docs/exec-plans/concept-v2-runtime-optimization.md`.
- Runtime contract: `docs/portfolio/CONCEPT_V2_RUNTIME.md`.
- Immutable evidence: `design-reference/concept-v2-runtime-optimization/3ad9b55161d10efe35f7069141793036147032a7/`.
- QA summary: `tools/concept-v2/app/design-qa.md`.
