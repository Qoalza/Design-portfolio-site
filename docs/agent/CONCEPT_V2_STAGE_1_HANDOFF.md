# Concept V2 — Stage 1 handoff

## Exact checkout

- Baseline: `19bf69b4c1c04d91b4a536cf8e63bae6d62fb423`.
- Corrective implementation commits through the previous checkpoint: `613fda4f35730d4d0fbebfb7bca6f70af8e0e9b5`, `5177616c66208c93b09c1a52cb6cf13c8943004e`, `2530a86`, `d97aa0d`, `f5ecabf`. Current corrective commits: `223e4b0`, `8687286`, `6a035f8`, `009ee7a`.
- Branch: `codex/concept-v2-heavy-polish`.
- Isolated worktree used for implementation: `/private/tmp/design-portfolio-concept-v2-heavy-polish`.
- Runtime root: `tools/concept-v2/app`.

No Portfolio/Admin runtime, published Concept snapshot, source archive, Figma file, production environment, or user-owned checkout was changed. Nothing was pushed, merged, or deployed.

## Local run

```sh
cd /private/tmp/design-portfolio-concept-v2-heavy-polish/tools/concept-v2/app
npm ci
npm run dev -- --host 127.0.0.1
```

Verification:

```sh
npm run check
npm run check:browser
```

`npm run check` covers lint, 24 focused logic/contract tests, and a production Vite build. The browser smoke runs against that built output. Exact Figma-to-code values and runtime evidence are recorded in `docs/agent/CONCEPT_V2_FIGMA_LEDGER.md` and `tools/concept-v2/app/design-qa.md`.

The previous live acceptance matrix covered 2560×1440, 1920×1600, 1920×1080, 1440×900, 1280×720, both sides of the 1300 px Hero boundary, and 1279×900 adaptive behavior. The current corrective pass revalidated the modified desktop states and automated contracts; a new final acceptance matrix is still required after the current-date marker is corrected. Exact measurements are recorded in `tools/concept-v2/app/design-qa.md`.

## Completed components

- Standalone reproducible Concept V2 application and isolated Library V2 foundation.
- Adaptive Hero with the exact 1300 CSS px height switch, retained published diagram, exact corner-image crop, selected-node icon/label/color animation, restored lower side strokes, corrected Code icon, SVG-aware lens coordinates, route pulses, terminal-only arrival glow, and cleanup on cancellation/unmount.
- Full Corvo project cards with one semantic layer tree, exact Enable/Hover states, 150 ms transitions, keyboard focus, Figma-accurate visible outer overflow, clipped main content, responsive intrinsic height, shadows, shade, glow, text state, and working links.
- Six-item experience section with source paths, one normalized scroll progress, 1615/4845 px horizontal/vertical travel, adaptive height compression, cumulative reached states with reverse clearing, exact no-knob progress bar, speed blur, resize preservation, reverse travel, and a non-sticky complete layout below 1280 px.
- Process icon fill on all three real cards, using exact line-only icon masks, one stable random frame-edge origin per interaction, user-approved 200 ms Ease In, quick re-entry continuity, keyboard focus parity, no icon movement, and reduced-motion final states.
- One existing Lenis loop only; the original global `wheelMultiplier: 1` is preserved and no wheel event is intercepted.

The project shade, decorative field boundary, cumulative experience states and local scroll pacing are complete. The exact current-date marker remains `IN_PROGRESS`: its dependent visual correction is stopped until the exact Figma node can be read again. Stage 2 must not begin by treating that marker as complete.

## Allowed Stage 2 zones

Stage 2 may change only the remaining presentation around the completed boundaries:

- final outer layout, widths, and padding of the three process cards, while preserving `ProcessStep`, its 64×64 icon frame, masks, state handling, and fill timing;
- the AI section;
- the currently absent/empty “Обо мне” section;
- the lower page and footer presentation;
- a local Bibata Classic cursor trial;
- surrounding page styling that does not alter Hero, project-card, experience, or process-fill behavior and verified geometry.

Protected implementation areas include `src/SvgLens.jsx`, `src/hero-layout.mjs`, `src/experience-layout.mjs`, `src/Experience.jsx`, `src/process-fill.mjs`, the corresponding tests, the three process masks, and the Hero/project/experience/process-state code in `src/App.jsx` and `src/style.css`.

## Stop-lines

- Do not use the Figma placeholder diagram; the published diagram remains the approved source.
- Keep existing behavior below 1280 CSS px.
- Do not add a second Lenis/inertia loop or wheel interception.
- Do not modify Admin, shared content contracts, published assets/snapshot, or the source archive.
- Figma remains read-only. Push, merge, deploy, and production actions remain separate explicit gates.
