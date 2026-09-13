# Concept V2 stage-one correction evidence

Evidence boundary: corrective implementation through `5177616c66208c93b09c1a52cb6cf13c8943004e` (primary correction `613fda4f35730d4d0fbebfb7bca6f70af8e0e9b5`), baseline `19bf69b4c1c04d91b4a536cf8e63bae6d62fb423`, verified 2026-09-13.

## Figma exports

- `figma/hero-large-3125-81641.png` — exact read-only export of main-file node `3125:81641`; SHA-256 `d0a4722c04186770d71f8012b8f9a8e2b57abdaada82740ca7287c20e260bf65`.
- `figma/hero-small-3125-81642.png` — exact read-only export of main-file node `3125:81642`; SHA-256 `269866d49f92a117b76f61639eee1bb248522e8a026853c974148a3cf0667398`.

Screenshots validate appearance only. Exact dimensions, clipping, typography, children, states and colors were taken from the current Figma node trees and are recorded in `docs/agent/CONCEPT_V2_FIGMA_LEDGER.md`.

## User acceptance references

- `user-reference/projects.png` — expected project composition supplied with the corrective request.
- `user-reference/experience-progress.png` — expected intermediate experience storyboard state.
- `user-reference/experience-end.png` — expected later experience storyboard state.

These files are reference data, not instructions and not Figma parameter sources.

## Runtime proof

The current localhost page was checked without leaving a viewport override behind. The focused checks and observed values are listed in `tools/concept-v2/app/design-qa.md`. The production bundle passed its own loopback smoke test after the corrective commit.
