# MLIR5 verification evidence

## Provenance

- Branch: `codex/main-layout-interaction-polish-mlir5`
- BASE_SHA: `38bda2ab5d21e3c5b0c405c42384c657a6a30aa8`
- CODE_SHA: `effc718663489d433aa801f88ef424347736d801`
- Review build: `NEXT_PUBLIC_BUILD_SHA=effc718663489d433aa801f88ef424347736d801`
- Served HTML: exact full `data-build-sha` matched CODE_SHA before evidence capture.
- Figma was read-only. Fresh references: Tooltip library `207:1498`, placement `735:90306`, AI TextButton `725:88725`.
- All implementation screenshots, traces and JSON in this directory were captured from CODE_SHA. Earlier failed runtime artifacts were removed and are not evidence.

## Block results

| Block | Result | Evidence |
|---|---|---|
| `MLIR5-SCR` | VERIFIED | Focused guards plus real Chromium and Zen wheel traces on `/` and `/projects/corvo`; routes differ by less than 1 px and `wheelMultiplier` remains `1`. Gallery RAF is demand-driven. |
| `MLIR5-TTP` | VERIFIED | Fresh Figma captures; Chromium and Zen at `1440×900`: one `20 px` line box, `20×20` icon, natural `278.93×46 px` geometry and intermediate opacity on both 200 ms enter/exit. |
| `MLIR5-TXB` | VERIFIED | Shared typed `neutralAccent`; computed label/icon `rgb(96, 100, 102)`, Onest `16/20`, external icon `20×20` in both browsers. |
| `MLIR5-ABA` | VERIFIED | Six-viewport matrices: Full at `1280×720` and `1440×900`; Adaptive at `1440×999`, `1440×1200`, `1440×1356`, `1920×1080`; first visible Zen sample is the expected variant with stable rect. Terminal gap is `48 px`, footer is not overlapped and `scrollHeight` is stable. |
| `MLIR5-LBX` | VERIFIED | Chromium and Zen top-layer dialog, Escape, focus return and scroll lock passed. Zen used real `pointerdown → pointerup → click`; no `element.click()` evidence. |

## Technical checks

- `node --experimental-strip-types --test tests/*.test.mjs`: `102/102 PASS`.
- `npm run lint`: PASS.
- `NEXT_PUBLIC_BUILD_SHA=<CODE_SHA> npm run build`: PASS.
- Preview HTML provenance: PASS, exact full SHA.
- Browser console warnings/errors: `0` in both final matrices.

## Browser evidence

- Chromium matrix: `chromium/matrix-results-effc718.json`; six viewports PASS.
- Chromium focused results: `chromium/focused-results-effc718.json`.
- Zen `1.21.15b`, build `126.8.18`, Gecko/Firefox UA `154.0`: `zen/matrix-results-effc718.json`; six viewports PASS.
- Real wheel traces: `traces/chromium-wheel-effc718.json` and `traces/zen-wheel-effc718.json`.
- Required viewports: `1280×720`, `1440×900`, `1440×999`, `1440×1200`, `1440×1356`, `1920×1080`.
- Initial and terminal screenshots are named by browser, viewport and short CODE_SHA.

## Lenis calibration decision

At the same starting position (`scrollY≈1199`) and equal total delta:

- Chromium: Home `360.5/361 px`, Corvo `360.5/361 px` for mouse-like/trackpad-like sequences.
- Zen: Home `360/361 px`, Corvo `360/361 px`.

The routes and input profiles are within the approved tolerance, so the tested `wheelMultiplier: 1` is retained. The candidate `0.9` was not needed.

## Review targets

- `/`: subjective Lenis response after ordinary wheel input no longer cancels tracking; AI `Figma` TextButton uses the accent interaction contract.
- `/projects`: disabled project Tooltip remains one line and animates in/out without clipping.
- `/projects/corvo`: first Full/Adaptive frame at low/tall viewport, `200 px` transition behavior, Gallery click/drag, lightbox and terminal `48 px` gap.

No merge or deploy was performed. `CLOSED` and `USER_ACCEPTED` still require explicit user acceptance.
