# MLIR6 verification evidence

- `BASE_SHA`: `9efff3deefaeba31424fd87910905e364dd70f93`
- `CODE_SHA`: `cca7d77f3a6cc8e5af37a26bae2abfe89f796642`
- Preview provenance: exact full `data-build-sha` confirmed in served HTML.
- Chromium: `151.0.0.0`.
- Gecko: Zen `1.21.15b`, build `126.8.18`.
- Figma access: read-only.

## Outcome

All critical `MLIR6-*` blocks are `VERIFIED` on the same runtime. The initial Chromium arbiter trace found native vertical leakage from a diagonal horizontal wheel series; G1 was reopened, the Gallery viewport received a native non-passive interception point, and all affected tests and browser evidence were recreated from the new `CODE_SHA`.

- `MLIR6-GAL`: shared Gallery/root pre-mutation arbiter, one horizontal step, stable root scroll, immediate next vertical series, demand-driven Gallery RAF.
- `MLIR6-LBX`: complete 15-frame live inventory, one frame layer, DPR-aware quality clamp, real mouse lightbox activation, Escape/focus/scroll restoration.
- `MLIR6-PRJ`: Hug CTA, Source Code Pro tags and complete 40 px `Update info` wrapper on `/` and `/projects`.
- `MLIR6-ACT/TIP`: unchanged action state machine, canonical Clipboard payload, Full/Adaptive feedback, inverse Check and accent Rocket semantics.
- `MLIR6-AI/PROC`: exact current AI copy; process remains arrow-only with Header above its local controls.
- `MLIR6-404/500R`: deterministic cross-browser stage scale; direct and hard-reload 404 checks; shared 500 structure regression checked at `1440×900` in both browsers without redesign.

## Artifacts

- `figma/`: fresh Figma screenshots, complete Gallery inventory and durable source map.
- `chromium/`: fresh viewport screenshots and machine-readable matrix results.
- `zen/`: fresh viewport screenshots and machine-readable matrix results from real WebDriver BiDi pointer actions.
- `traces/gallery-arbiter/`: real Chromium and Zen diagonal-horizontal plus vertical-follow-up traces.
- `traces/share-copy/`: canonical Clipboard verification.
- `results.json`: aggregate statuses and provenance.

No old MLIR evidence is used as proof for this runtime. Merge and deploy were not performed.
