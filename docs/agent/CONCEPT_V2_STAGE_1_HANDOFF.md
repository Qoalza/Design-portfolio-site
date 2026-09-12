# Concept V2 — Stage 1 handoff

## Exact checkout

- Baseline: `19bf69b4c1c04d91b4a536cf8e63bae6d62fb423`.
- Implementation commit: `b8121c8705121e47f738cd077c77ad430644716f`.
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

`npm run check` covers lint, 13 focused logic/contract tests, and a production Vite build. The browser smoke runs against that built output. Exact Figma-to-code values and runtime evidence are recorded in `docs/agent/CONCEPT_V2_FIGMA_LEDGER.md`.

## Completed components

- Standalone reproducible Concept V2 application and isolated Library V2 foundation.
- Adaptive Hero with the exact 1300 CSS px height switch, retained published diagram, corrected Code icon, SVG-aware lens coordinates, route pulses, terminal-only arrival glow, and cleanup on cancellation/unmount.
- Full Corvo project cards with one semantic layer tree, exact Enable/Hover states, 150 ms transitions, keyboard focus, clipping, shadows, shade, glow, text state, and working links.
- Complete six-item experience section with source paths, one normalized scroll progress, sticky travel, 1.5:1 vertical/horizontal ratio, adaptive height compression, speed blur, resize preservation, reverse travel, and centered final item.
- Process icon fill on all three real cards, using exact line-only icon masks, one stable random frame-edge origin per interaction, 150 ms Ease In, quick re-entry continuity, keyboard focus parity, no icon movement, and reduced-motion final states.

These blocks are complete Stage 1 boundaries. Stage 2 must not redesign, reconnect, resize internally, or replace their mechanics.

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
