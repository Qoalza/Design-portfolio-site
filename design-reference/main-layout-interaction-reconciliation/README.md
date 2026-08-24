# MLIR2 verification evidence

Status: `VERIFIED` pending final remote/Draft PR SHA confirmation.

- Branch: `codex/main-layout-interaction-reconciliation`
- Base SHA: `924f52824eedd29a252b63cdbdcf3402c592cd9a`
- Verified runtime `CODE_SHA`: `69dc9b7823cebc839482a037e6dbb9abaa6ca182`
- Local production preview: `http://127.0.0.1:3000`
- Chromium: `151.0.0.0`
- Gecko: Zen `1.21.15b` (build `126.8.18`)
- Figma: read-only throughout the Goal.

The previous `design-reference/main-chapter-reconciliation-v2/` directory is historical evidence for an older Figma state and is not used as proof for `MLIR2-*`.

## Block index

| Block | Status | Evidence |
|---|---|---|
| `MLIR2-INV` | `VERIFIED` | `inventory.json` |
| `MLIR2-PROV` | `VERIFIED` | `provenance/result.json` |
| `MLIR2-SQB` | `VERIFIED` | `square-button/result.json` |
| `MLIR2-HDR` | `VERIFIED` | `headers/result.json` |
| `MLIR2-META` | `VERIFIED` | `project-actions/result.json` |
| `MLIR2-RSM` | `VERIFIED` | `resume/result.json` |
| `MLIR2-AI` | `VERIFIED` | `ai/result.json` |
| `MLIR2-PROC` | `VERIFIED` | `process/result.json` |
| `MLIR2-PRJ` | `VERIFIED` | `projects/result.json` |
| `MLIR2-CNT` | `VERIFIED` | `corvo-content/result.json` |
| `MLIR2-GAL` | `VERIFIED` | `corvo-gallery/result.json` |
| `MLIR2-ABA` | `VERIFIED` | `action-bar/result.json` |
| `MLIR2-NAV` | `VERIFIED` | `navigation/result.json` |

## Final follow-up

The confirmed follow-up for `MLIR2-CNT/PROC/PRJ/META/ABA/GAL` and the navigation regression is recorded in `follow-up-69dc9b7.json`.

- Chromium matrix: `action-bar/chromium-follow-up-matrix-69dc9b7.json` — `PASS (6/6)` with fresh screenshots.
- Zen matrix: `gecko/zen-matrix-69dc9b7.json` — `PASS (6/6)` with fresh screenshots.
- Five Corvo section heights: `393, 826, 792, 764, 288 px` in both browser engines.
- Action bar initial state follows the measured information anchor, including immediate `ADAPTIVE` at `1440×1200`, `1440×1356` and `1920×1080`.
- Navigation activates the clicked item immediately and retains the final section through Gallery.
- Gallery has no left fade in any state; right fade is absent on the last item; complete device frames remain `16×16 px` with `8 px` label gap.
- Project cards use intrinsic content groups and a measured `32 px` details-to-platforms gap.
- Unavailable homepage project details use a disabled, non-navigating `Скоро`; available details use `Подробнее`.
- All three process images load the versioned current-Figma source, preserve real alpha, and have no CSS blur/filter.

## Technical checks

- Focused runtime tests: `PASS (27/27)`.
- Focused content/navigation tests: `PASS (11/11)`.
- `npm run lint`: `PASS`.
- `NEXT_PUBLIC_BUILD_SHA=69dc9b7823cebc839482a037e6dbb9abaa6ca182 npm run build`: `PASS`.
- Served HTML `data-build-sha`: exact full `CODE_SHA`.
- Page console errors in Chromium and Zen matrices: none.

## User review

Review the exact visual alignment of the updated process illustrations, project-card rhythm and CTA labels, five Corvo information sections, Gallery device icons/fades, initial Full/Adaptive selection, section navigation and footer collision. Final package status changes to `READY_FOR_USER_REVIEW` only after remote branch, Draft PR and documentation SHA are confirmed.
