# Design QA — Sarafan gallery frame

- Source visual truth: `/var/folders/rt/f08dbnw150z9tsc_83q81g3c0000gn/T/TemporaryItems/NSIRD_screencaptureui_BPPLv0/Снимок экрана — 2026-09-01 в 19.38.04.png` (`1590×1116`).
- Implementation: `http://127.0.0.1:41732/projects/sarafan-radio`.
- Implementation capture: `/private/tmp/sarafan-gallery-frame-after.jpg` (`1200×796`).
- Browser viewport: `1280px` wide, device scale factor `1`.
- State: Sarafan draft overlay, Desktop gallery, first and only image.
- CSS media box after normalization: fixed slot `740×512`; actual `3:2` media frame `740×493.33` centered inside it.

## Full-view and focused comparison

The supplied defect screenshot and the browser-rendered implementation capture were reviewed together in the same multimodal turn. The focused browser check also measured the actual frame: transparent background, `overflow: hidden`, `12px` radius and `1px solid #e8eaeb` stroke.

The source report showed three P1/P2 defects: the first Desktop image inherited a no-frame exception, the fixed trigger painted a gray letterbox around a variable-ratio image, and clipping/radius were absent. The revised preview removes the painted letterbox, applies the approved frame to the actual media bounds and preserves the fixed gallery slot.

## Required fidelity surfaces

- Fonts and typography: unchanged; out of scope for the frame fix.
- Spacing and layout rhythm: the `740×512` slot is preserved; the `740×493.33` media frame is centered without changing gallery geometry.
- Colors and tokens: frame stroke is `#e8eaeb`; the former `#f5f6f7` contain background is removed.
- Image quality and assets: original `2880×1920` PNG remains unencoded and uncropped.
- Copy and content: unchanged.

## Comparison history

1. Before: first Desktop/Tablet items used `clip:false`, `radius:0`, transparent zero-width stroke; contain trigger used a gray background.
2. Fix: all device items receive code-owned clipping/radius/stroke; contained preview is sized to the source aspect ratio and centered in the unchanged slot.
3. After: Sarafan computes `740×493.33`, transparent background, `12px` radius, `1px #e8eaeb` stroke; Corvo remains `740×512` with the same frame contract and no console errors.

## Findings

No actionable P0/P1/P2 mismatch remains for the requested frame behavior. No focused typography or icon crop was needed because those surfaces were not changed.

final result: passed
