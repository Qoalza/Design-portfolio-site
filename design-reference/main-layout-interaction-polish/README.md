# MLIR4 verification evidence

## Provenance

- Branch: `codex/main-layout-interaction-polish`
- BASE_SHA: `12c05c3930d31b96e8481020d1e9ceb026764c6f`
- CODE_SHA: `0d834e9d96f78e34e4e8e4796468446c7ccbad8d`
- Review build: `NEXT_PUBLIC_BUILD_SHA=0d834e9d96f78e34e4e8e4796468446c7ccbad8d`
- Served HTML: exact full `data-build-sha` matched CODE_SHA before evidence capture.
- Figma was used read-only. Current source nodes: main `510:28120`, projects `373:50236`, Corvo `373:47102`/`373:47103`, action bar `373:50562`, Tooltip `207:1498` and placement `735:90306`.
- Existing Figma source captures in `design-reference/main-layout-interaction-followup/figma/` are design references only. All implementation screenshots in this directory are fresh captures from CODE_SHA.

## Block results

| Block | Result | Evidence |
|---|---|---|
| `MLIR4-SYS` | VERIFIED | Focused typography/control tests; Home, Projects and Corvo foundation captures in Chromium and Zen. |
| `MLIR4-HOME` | VERIFIED | `chromium/home-1440x900-0d834e9.jpg`, `zen/foundation-home-0d834e9.png`; exact current copy, Hero eyebrow and CTA destinations confirmed. |
| `MLIR4-PRJ` | VERIFIED | `chromium/projects-1440x900-0d834e9.jpg`, `zen/foundation-projects-0d834e9.png`; only Corvo links to detail, unavailable projects render shared `Скоро` contract. |
| `MLIR4-ABA` | VERIFIED | Six-viewport Chromium and Zen matrices: Full at 1280×720, 1440×900, 1440×999; Adaptive at 1440×1200, 1440×1356, 1920×1080; valid first measurement; 48px terminal gap and stable scrollHeight. |
| `MLIR4-NAV` | VERIFIED | Gallery entry and document bottom activate structural last section; direct hash and real link click settle target at sticky boundary without double offset. |
| `MLIR4-GAL` | VERIFIED | Discrete Desktop movement, Mobile no-overflow disablement, right-only fade, top-layer dialog, Escape, focus return and scroll lock passed in both matrices. |
| `MLIR4-SCR` | VERIFIED | Shared ordered RAF, root/Gallery Lenis controllers, route reset, hash offset, touch/coarse and reduced-motion native fallbacks verified. |

## Technical checks

- Focused/unit/component tests: `95/95 PASS` with `node --experimental-strip-types --test tests/*.test.mjs`.
- `npm run lint`: PASS.
- `NEXT_PUBLIC_BUILD_SHA=<CODE_SHA> npm run build`: PASS; only `/projects/corvo` is generated as a project detail route.
- Lenis dependency: exact `1.3.25`, MIT license.

## Browser matrix

- Chromium: `chromium/matrix-results-0d834e9.json`, six viewports PASS.
- Zen `1.21.15b`, UA Gecko/Firefox `154.0`: `zen/matrix-results-0d834e9.json`, six viewports PASS; foundation routes `/`, `/projects`, `/projects/corvo` PASS; page console warnings/errors `0`.
- Required viewports: `1280×720`, `1440×900`, `1440×999`, `1440×1200`, `1440×1356`, `1920×1080`.
- Touch/coarse and `prefers-reduced-motion`: Lenis not initialized; native scroll retained.

## Review targets

- `/`: subjective Lenis micro-inertia, Hero eyebrow, Codex block, `Полное CV`, disabled project Tooltip.
- `/projects`: CTA availability, intrinsic project layout, Tooltip, preview shadows.
- `/projects/corvo`: correct first Full/Adaptive frame at low/tall viewport, sticky navigation, Gallery pagination, lightbox and terminal action-bar gap.

No merge or deploy was performed. User acceptance is still required; `CLOSED` is not set.
